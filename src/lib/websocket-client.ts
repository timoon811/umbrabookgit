import WebSocket from 'ws';
import { prisma } from './prisma';

interface DepositSource {
  id: string;
  name: string;
  token: string;
  projectId: string;
  isActive: boolean;
}

interface WebSocketMessage {
  name: string;
  data: any;
}

interface DepositData {
  id: string;
  mammothId: string;
  mammothLogin: string;
  mammothCountry: string;
  mammothPromo?: string;
  token: string;
  amount: number;
  amountUsd: number;
  workerPercent: number;
  domain: string;
  txHash?: string;
}

class DepositWebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private diedTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private logs: Array<{timestamp: Date, level: 'info' | 'warn' | 'error', message: string, sourceId?: string}> = [];
  private maxLogs = 1000; // Максимальное количество логов

  constructor() {
    // Предотвращаем создание WebSocket соединений на клиенте
    if (typeof window === 'undefined') {
      this.log('info', 'WebSocket клиент инициализирован');
      // Инициализируем соединения с небольшой задержкой, чтобы дать время завершиться загрузке
      setTimeout(() => {
        this.initializeConnections();
      }, 1000);
      this.setupPeriodicReconnect();
    }
  }

  private async initializeConnections() {
    try {
      const depositSources = await prisma.deposit_sources.findMany({
        where: { isActive: true }
      });

      console.log(`🔌 Инициализация ${depositSources.length} WebSocket подключений для депозитов`);

      for (const source of depositSources) {
        this.connectToSource(source);
      }
    } catch (error) {
      console.error('❌ Ошибка инициализации WebSocket подключений:', error);
    }
  }

  private connectToSource(source: DepositSource) {
    // Проверяем токен перед подключением
    if (!source.token || source.token.length < 10) {
      this.log('error', `Источник ${source.name}: некорректный токен (длина: ${source.token?.length || 0})`, source.id);
      return;
    }

    const encodedToken = encodeURIComponent(`Worker ${source.token}`);
    const wsUrl = `wss://gambler-panel.com/api/ws?token=${encodedToken}&connectionType=bot`;

    this.log('info', `Подключение к источнику ${source.name} (${source.id})`, source.id);
    this.log('info', `WebSocket URL: ${wsUrl}`, source.id);
    this.log('info', `Токен: ${source.token.substring(0, 8)}...${source.token.substring(source.token.length - 4)}`, source.id);

    try {
      const ws = new WebSocket(wsUrl);

    // Очищаем предыдущие таймеры
    this.clearTimeouts(source.id);

    // Устанавливаем начальный таймер (20 секунд на подключение согласно документации)
    const setDiedTimeout = (time = 10000) => {
      this.clearTimeouts(source.id);
      const diedTimeout = setTimeout(() => {
        this.log('warn', `Соединение ${source.name} мертво (timeout ${time}ms), переподключение...`, source.id);
        ws.close();
        this.reconnectToSource(source);
      }, time);
      this.diedTimeouts.set(source.id, diedTimeout);
    };

    // Устанавливаем начальный timeout на 20 секунд (как в примере)
    setDiedTimeout(20000);

    ws.on('open', () => {
      this.log('info', `✅ Подключено к источнику ${source.name}`, source.id);
      // НЕ очищаем timeout здесь - ждем первый ping
    });

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString('utf8'));
        
        this.log('info', `📨 Сообщение от ${source.name}: ${message.name}`, source.id);

        if (message.name === 'ping') {
          // Отвечаем на ping согласно документации
          setDiedTimeout(); // Сбрасываем таймер при получении ping
          ws.send(JSON.stringify({ name: 'pong' }));
          this.log('info', `🏓 Ответ pong отправлен ${source.name}`, source.id);

        } else if (message.name === 'newDeposit') {
          // Обрабатываем новый депозит
          this.handleNewDeposit(source, message.data);
        } else {
          this.log('info', `📨 Неизвестное сообщение от ${source.name}: ${message.name}`, source.id);
        }
      } catch (error) {
        this.log('error', `Ошибка обработки сообщения от ${source.name}: ${error}`, source.id);
      }
    });

    ws.on('close', () => {
      this.log('warn', `🔌 Соединение с ${source.name} закрыто, планируем переподключение...`, source.id);
      this.clearTimeouts(source.id);
      this.reconnectToSource(source);
    });

    ws.on('error', (error) => {
      this.log('error', `Ошибка WebSocket соединения с ${source.name}: ${error}`, source.id);
      this.clearTimeouts(source.id);
      this.reconnectToSource(source);
    });

    this.connections.set(source.id, ws);
    
    } catch (error) {
      this.log('error', `Ошибка создания WebSocket соединения с ${source.name}: ${error}`, source.id);
    }
  }

  private async handleNewDeposit(source: DepositSource, depositData: DepositData) {
    try {
      this.log('info', `💰 Новый депозит от ${source.name}: ID=${depositData.id}, Логин=${depositData.mammothLogin}, Сумма=${depositData.amount} ${depositData.token} ($${depositData.amountUsd})`, source.id);

      // Проверяем, существует ли уже такой депозит
      const existingDeposit = await prisma.deposits.findUnique({
        where: { id: depositData.id }
      });

      if (existingDeposit) {
        this.log('warn', `Депозит ${depositData.id} уже существует, пропускаем`, source.id);
        return;
      }

      // Получаем настройки комиссии для источника
      const depositSource = await prisma.deposit_sources.findUnique({
        where: { id: source.id }
      });

      if (!depositSource) {
        this.log('error', `Источник депозитов ${source.id} не найден`, source.id);
        return;
      }

      // Рассчитываем комиссию
      const commissionPercent = depositSource.commission;
      const commissionAmount = (depositData.amount * commissionPercent) / 100;
      const commissionAmountUsd = (depositData.amountUsd * commissionPercent) / 100;
      const netAmount = depositData.amount - commissionAmount;
      const netAmountUsd = depositData.amountUsd - commissionAmountUsd;

      // Создаем новый депозит
      await prisma.deposits.create({
        data: {
          id: depositData.id,
          depositSourceId: source.id,
          mammothId: depositData.mammothId,
          mammothLogin: depositData.mammothLogin,
          mammothCountry: depositData.mammothCountry || 'US',
          mammothPromo: depositData.mammothPromo,
          token: depositData.token,
          amount: depositData.amount,              // Грязная сумма
          amountUsd: depositData.amountUsd,        // Грязная сумма USD
          commissionPercent: commissionPercent,    // Процент комиссии
          commissionAmount: commissionAmount,      // Сумма комиссии в токене
          commissionAmountUsd: commissionAmountUsd,// Сумма комиссии в USD
          netAmount: netAmount,                    // Чистая сумма в токене
          netAmountUsd: netAmountUsd,              // Чистая сумма в USD
          workerPercent: depositData.workerPercent || 0,
          domain: depositData.domain,
          txHash: depositData.txHash,
          processed: false
        }
      });

      this.log('info', `✅ Депозит ${depositData.id} успешно сохранен`, source.id);

      // Здесь можно добавить дополнительную логику обработки депозита
      // Например, отправку уведомлений, обновление статистики и т.д.

    } catch (error) {
      this.log('error', `Ошибка обработки депозита ${depositData.id}: ${error}`, source.id);
    }
  }

  private reconnectToSource(source: DepositSource) {
    // Очищаем предыдущий таймер переподключения
    const existingTimeout = this.reconnectTimeouts.get(source.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Планируем переподключение через 5 секунд согласно документации
    const reconnectTimeout = setTimeout(() => {
      this.log('info', `🔄 Переподключение к источнику ${source.name}...`, source.id);
      this.connectToSource(source);
    }, 5000);

    this.reconnectTimeouts.set(source.id, reconnectTimeout);
  }

  private clearTimeouts(sourceId: string) {
    const diedTimeout = this.diedTimeouts.get(sourceId);
    if (diedTimeout) {
      clearTimeout(diedTimeout);
      this.diedTimeouts.delete(sourceId);
    }

    const reconnectTimeout = this.reconnectTimeouts.get(sourceId);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(sourceId);
    }
  }

  private setupPeriodicReconnect() {
    // Каждые 5 минут проверяем все активные источники
    setInterval(async () => {
      try {
        const activeSources = await prisma.deposit_sources.findMany({
          where: { isActive: true }
        });

        for (const source of activeSources) {
          if (!this.connections.has(source.id) || this.connections.get(source.id)?.readyState !== WebSocket.OPEN) {
            this.log('info', `🔄 Периодическая проверка: переподключение к ${source.name}`, source.id);
            this.connectToSource(source);
          }
        }
      } catch (error) {
        this.log('error', `Ошибка периодической проверки подключений: ${error}`);
      }
    }, 5 * 60 * 1000); // 5 минут
  }

  // Метод для добавления нового источника
  public addSource(source: DepositSource) {
    if (source.isActive) {
      this.connectToSource(source);
    }
  }

  // Метод для обновления источника
  public updateSource(source: DepositSource) {
    this.removeSource(source.id);
    if (source.isActive) {
      this.connectToSource(source);
    }
  }

  // Метод для удаления источника
  public removeSource(sourceId: string) {
    const connection = this.connections.get(sourceId);
    if (connection) {
      connection.close();
      this.connections.delete(sourceId);
    }
    this.clearTimeouts(sourceId);
  }

  // Метод для получения статистики подключений
  public getConnectionStats() {
    const stats: Record<string, any> = {};

    for (const [sourceId, connection] of this.connections.entries()) {
      stats[sourceId] = {
        state: connection.readyState,
        stateText: connection.readyState === WebSocket.OPEN ? 'OPEN' :
                  connection.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                  connection.readyState === WebSocket.CLOSING ? 'CLOSING' : 'CLOSED'
      };
    }

    return stats;
  }

  // Метод для принудительного переподключения всех соединений
  public reconnectAll() {
    this.log('info', '🔄 Переподключение всех WebSocket соединений...');

    for (const [sourceId, connection] of this.connections.entries()) {
      connection.close();
    }

    this.connections.clear();
    this.clearAllTimeouts();
    this.initializeConnections();
  }

  private clearAllTimeouts() {
    for (const timeout of this.diedTimeouts.values()) {
      clearTimeout(timeout);
    }
    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.diedTimeouts.clear();
    this.reconnectTimeouts.clear();
  }

  // Метод завершения работы
  public shutdown() {
    this.log('info', '🔌 Завершение работы WebSocket клиента...');

    for (const connection of this.connections.values()) {
      connection.close();
    }

    this.clearAllTimeouts();
    this.connections.clear();
  }

  // Метод для добавления лога
  private log(level: 'info' | 'warn' | 'error', message: string, sourceId?: string) {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      sourceId
    };
    
    this.logs.push(logEntry);
    
    // Ограничиваем количество логов
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Также выводим в консоль с эмодзи для удобства
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    const prefix = sourceId ? `[${sourceId.slice(-8)}]` : '[GLOBAL]';
    console.log(`${emoji} ${prefix} ${message}`);
  }

  // Метод для получения логов
  public getLogs(sourceId?: string): Array<{timestamp: Date, level: string, message: string, sourceId?: string}> {
    if (sourceId) {
      return this.logs.filter(log => log.sourceId === sourceId || !log.sourceId);
    }
    return [...this.logs];
  }

  // Метод для очистки логов
  public clearLogs() {
    this.logs = [];
    this.log('info', 'Логи очищены');
  }
}

// Создаем глобальный экземпляр клиента
let wsClient: DepositWebSocketClient | null = null;

export function getWebSocketClient(): DepositWebSocketClient {
  if (!wsClient) {
    wsClient = new DepositWebSocketClient();
  }
  return wsClient;
}

export function shutdownWebSocketClient() {
  if (wsClient) {
    wsClient.shutdown();
    wsClient = null;
  }
}

// Инициализация при запуске сервера
if (typeof window === 'undefined') {
  // Server-side initialization
  getWebSocketClient();
}
