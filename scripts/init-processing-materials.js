const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initProcessingMaterials() {
  try {
    console.log('🚀 Инициализация материалов для обработки...');

    // Очищаем существующие данные
    console.log('🧹 Очистка существующих данных...');
    await prisma.processing_resources.deleteMany({});
    await prisma.processing_templates.deleteMany({});
    await prisma.processing_scripts.deleteMany({});
    await prisma.processing_instructions.deleteMany({});

    // Создаем базовые инструкции
    const instructions = [
      {
        title: 'Основные правила работы с депозитами',
        content: `1. Всегда указывайте корректный email депозитера
2. Сумма всегда указывается в долларах (USD)
3. Выбирайте правильную сеть/валюту для пометки
4. Добавляйте заметки при необходимости
5. Проверяйте данные перед отправкой`,
        category: 'rules',
        priority: 5,
        isActive: true,
        isPublic: true
      },
      {
        title: 'Часто задаваемые вопросы',
        content: `Q: Когда начисляются бонусы?
A: Бонусы начисляются автоматически при создании депозита.

Q: Можно ли изменить депозит после создания?
A: Нет, депозиты нельзя редактировать после создания.

Q: Как подать заявку на зарплату?
A: Используйте кнопку "Заявка на ЗП" в верхней части страницы.`,
        category: 'faq',
        priority: 4,
        isActive: true,
        isPublic: true
      },
      {
        title: 'Советы по эффективной работе',
        content: `• Ведите учет всех депозитов
• Используйте готовые скрипты для общения с клиентами
• Регулярно проверяйте статистику
• Следите за обновлениями системы`,
        category: 'tips',
        priority: 3,
        isActive: true,
        isPublic: true
      }
    ];

    console.log('📝 Создание инструкций...');
    await prisma.processing_instructions.createMany({
      data: instructions
    });
    console.log(`✅ Создано ${instructions.length} инструкций`);

    // Создаем базовые скрипты
    const scripts = [
      {
        title: 'Приветствие клиента',
        content: 'Здравствуйте! Я помогу вам с обработкой депозита. Пожалуйста, укажите сумму и выбранную криптовалюту.',
        description: 'Стандартное приветствие для начала диалога',
        category: 'greeting',
        language: 'ru',
        isActive: true,
        isPublic: true
      },
      {
        title: 'Уточнение деталей',
        content: 'Для корректной обработки мне нужен ваш email. Также укажите, если у вас есть особые требования.',
        description: 'Запрос дополнительной информации от клиента',
        category: 'clarification',
        language: 'ru',
        isActive: true,
        isPublic: true
      },
      {
        title: 'Подтверждение депозита',
        content: 'Отлично! Ваш депозит на сумму $[СУММА] в сети [ВАЛЮТА] принят. Бонус составит $[БОНУС].',
        description: 'Подтверждение успешного создания депозита',
        category: 'confirmation',
        language: 'ru',
        isActive: true,
        isPublic: true
      },
      {
        title: 'Поддержка клиента',
        content: 'Если у вас возникли вопросы, я готов помочь. Опишите проблему, и мы её решим.',
        description: 'Предложение помощи при возникновении проблем',
        category: 'support',
        language: 'ru',
        isActive: true,
        isPublic: true
      }
    ];

    console.log('📜 Создание скриптов...');
    await prisma.processing_scripts.createMany({
      data: scripts
    });
    console.log(`✅ Создано ${scripts.length} скриптов`);

    // Создаем базовые ресурсы
    const resources = [
      {
        title: 'Руководство по криптовалютам',
        description: 'Подробное описание всех поддерживаемых криптовалют и сетей',
        type: 'link',
        url: 'https://docs.example.com/crypto-guide',
        category: 'education',
        isActive: true,
        isPublic: true,
        order: 1
      },
      {
        title: 'Видео-инструкция по работе с системой',
        description: 'Пошаговое руководство по использованию всех функций',
        type: 'video',
        url: 'https://youtube.com/watch?v=example',
        category: 'tutorial',
        isActive: true,
        isPublic: true,
        order: 2
      },
      {
        title: 'Шаблоны документов',
        description: 'Готовые шаблоны для работы с клиентами',
        type: 'document',
        url: 'https://docs.example.com/templates',
        category: 'tools',
        isActive: true,
        isPublic: true,
        order: 3
      }
    ];

    console.log('🔗 Создание ресурсов...');
    await prisma.processing_resources.createMany({
      data: resources
    });
    console.log(`✅ Создано ${resources.length} ресурсов`);

    // Создаем базовые шаблоны
    const templates = [
      {
        name: 'Уведомление о депозите',
        description: 'Шаблон для уведомления клиента о создании депозита',
        content: `Уважаемый клиент!

Ваш депозит на сумму $[СУММА] в сети [ВАЛЮТА] успешно создан.

Детали депозита:
- Сумма: $[СУММА]
- Сеть: [ВАЛЮТА]
- Бонус: $[БОНУС]
- Дата: [ДАТА]

Спасибо за доверие!`,
        type: 'email',
        variables: JSON.stringify(['СУММА', 'ВАЛЮТА', 'БОНУС', 'ДАТА']),
        isActive: true,
        isPublic: true
      },
      {
        name: 'Напоминание о проверке',
        description: 'Шаблон для напоминания о необходимости проверки данных',
        content: `Добрый день!

Напоминаем о необходимости проверить данные депозита:
- Email клиента: [EMAIL]
- Сумма: $[СУММА]
- Валюта: [ВАЛЮТА]

Убедитесь в корректности всех данных перед отправкой.`,
        type: 'notification',
        variables: JSON.stringify(['EMAIL', 'СУММА', 'ВАЛЮТА']),
        isActive: true,
        isPublic: true
      }
    ];

    console.log('📋 Создание шаблонов...');
    await prisma.processing_templates.createMany({
      data: templates
    });
    console.log(`✅ Создано ${templates.length} шаблонов`);

    console.log('🎉 Инициализация материалов завершена успешно!');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initProcessingMaterials();
