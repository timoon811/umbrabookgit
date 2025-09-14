import { Block } from '@/types/editor';

/**
 * Парсит Markdown в массив блоков редактора
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
  if (!markdown.trim()) {
    return [createEmptyBlock()];
  }

  // Разделяем по двойным переносам строк (markdown параграфы)
  const sections = markdown.split(/\n\s*\n/);
  const blocks: Block[] = [];

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    const lines = trimmedSection.split('\n');
    const firstLine = lines[0];

    // YouTube ссылки
    const youtubeMatch = firstLine.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch && lines.length === 1) {
      blocks.push({
        id: generateId(),
        type: 'youtube',
        content: firstLine,
        metadata: { youtubeId: youtubeMatch[1] }
      });
      continue;
    }

    // Заголовки (только если одна строка)
    if (lines.length === 1) {
      if (firstLine.startsWith('# ')) {
        blocks.push({
          id: generateId(),
          type: 'heading1',
          content: firstLine.substring(2),
          metadata: {}
        });
        continue;
      }

      if (firstLine.startsWith('## ')) {
        blocks.push({
          id: generateId(),
          type: 'heading2',
          content: firstLine.substring(3),
          metadata: {}
        });
        continue;
      }

      if (firstLine.startsWith('### ')) {
        blocks.push({
          id: generateId(),
          type: 'heading3',
          content: firstLine.substring(4),
          metadata: {}
        });
        continue;
      }

      // Изображения
      const imageMatch = firstLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        blocks.push({
          id: generateId(),
          type: 'image',
          content: imageMatch[2],
          metadata: { url: imageMatch[2], alt: imageMatch[1], caption: imageMatch[1] }
        });
        continue;
      }

      // Файлы (ссылки на файлы)
      const fileMatch = firstLine.match(/\[📎\s*([^\]]+)\]\(([^)]+)\)/);
      if (fileMatch) {
        blocks.push({
          id: generateId(),
          type: 'file',
          content: fileMatch[2],
          metadata: { url: fileMatch[2], name: fileMatch[1] }
        });
        continue;
      }

      // Разделитель
      if (firstLine.trim() === '---') {
        blocks.push({
          id: generateId(),
          type: 'divider',
          content: '',
          metadata: {}
        });
        continue;
      }
    }

    // Код блоки
    if (firstLine.startsWith('```')) {
      const language = firstLine.substring(3).trim() || 'text';
      const codeLines = lines.slice(1); // Убираем первую строку с ```

      // Убираем последнюю строку если она содержит только ```
      if (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '```') {
        codeLines.pop();
      }

      blocks.push({
        id: generateId(),
        type: 'code',
        content: codeLines.join('\n'),
        metadata: { language }
      });
      continue;
    }

    // Цитаты (многострочные)
    if (firstLine.startsWith('> ')) {
      const quoteLines = lines.map(line =>
        line.startsWith('> ') ? line.substring(2) : line
      );
      blocks.push({
        id: generateId(),
        type: 'quote',
        content: quoteLines.join('\n'),
        metadata: {}
      });
      continue;
    }

    // Callout блоки
    const calloutMatch = firstLine.match(/^>\s*\*\*(INFO|WARNING|ERROR|SUCCESS)\*\*:\s*(.+)$/i);
    if (calloutMatch) {
      const calloutType = calloutMatch[1].toLowerCase() as 'info' | 'warning' | 'error' | 'success';
      const content = lines.length > 1
        ? [calloutMatch[2], ...lines.slice(1)].join('\n')
        : calloutMatch[2];

      blocks.push({
        id: generateId(),
        type: 'callout',
        content: content,
        metadata: { calloutType }
      });
      continue;
    }

    // Списки (многострочные)
    if (firstLine.match(/^[-*] /) || firstLine.match(/^\d+\. /)) {
      const isNumbered = firstLine.match(/^\d+\. /);
      const listContent = lines.map(line => {
        if (isNumbered) {
          return line.replace(/^\d+\. /, '');
        } else {
          return line.replace(/^[-*] /, '');
        }
      }).join('\n');

      blocks.push({
        id: generateId(),
        type: isNumbered ? 'numbered-list' : 'list',
        content: listContent,
        metadata: {}
      });
      continue;
    }

    // Обычный текст (многострочный параграф)
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      content: trimmedSection,
      metadata: {}
    });
  }

  return blocks.length > 0 ? blocks : [createEmptyBlock()];
}

/**
 * Конвертирует массив блоков в Markdown
 */
export function convertBlocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1':
        return `# ${block.content}`;
      case 'heading2':
        return `## ${block.content}`;
      case 'heading3':
        return `### ${block.content}`;
      case 'quote':
        // Обрабатываем многострочные цитаты
        return block.content.split('\n').map(line => `> ${line}`).join('\n');
      case 'code':
        return `\`\`\`${block.metadata?.language || 'text'}\n${block.content}\n\`\`\``;
      case 'list':
        // Обрабатываем многострочные списки
        return block.content.split('\n').map(line => `- ${line}`).join('\n');
      case 'numbered-list':
        // Обрабатываем многострочные нумерованные списки
        return block.content.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
      case 'image':
        return `![${block.metadata?.alt || ''}](${block.metadata?.url || block.content})`;
      case 'file':
        return `[📎 ${block.metadata?.name || 'Файл'}](${block.metadata?.url || block.content})`;
      case 'youtube':
        return block.content;
      case 'internal-link':
        return `[${block.content}](/docs/${block.metadata?.internalPageId})`;
      case 'external-link':
        return `[${block.content}](${block.metadata?.linkUrl})`;
      case 'callout':
        const calloutType = block.metadata?.calloutType || 'info';
        const lines = block.content.split('\n');
        if (lines.length === 1) {
          return `> **${calloutType.toUpperCase()}**: ${block.content}`;
        } else {
          return `> **${calloutType.toUpperCase()}**: ${lines[0]}\n${lines.slice(1).map(line => `> ${line}`).join('\n')}`;
        }
      case 'divider':
        return '---';
      default:
        // Параграфы сохраняют свою структуру как есть
        return block.content;
    }
  }).join('\n\n');
}

/**
 * Создает пустой блок параграфа
 */
export function createEmptyBlock(): Block {
  return {
    id: generateId(),
    type: 'paragraph',
    content: '',
    metadata: {}
  };
}

/**
 * Генерирует уникальный ID для блока
 */
export function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Извлекает YouTube ID из URL
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

