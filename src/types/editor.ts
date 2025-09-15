export interface Block {
  id: string;
  type: string;
  content: string;
  metadata?: {
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    url?: string;
    alt?: string;
    caption?: string;
    language?: string;
    fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    highlight?: boolean;
    highlightColor?: string;
    linkUrl?: string;
    linkTitle?: string;
    internalPageId?: string;
    youtubeId?: string;
    videoUrl?: string;
    isCallout?: boolean;
    calloutType?: 'info' | 'warning' | 'error' | 'success';
    name?: string;     // Для файлов
    size?: number;     // Размер файла в байтах
    type?: string;     // MIME тип файла
    rows?: number;
    columns?: number;
  };
}

export interface BlockType {
  type: string;
  title: string;
  description: string;
  icon: string;
  shortcut?: string;
  category: 'basic' | 'media' | 'structure' | 'advanced';
}

export const blockTypes: BlockType[] = [
  // Basic
  { type: 'paragraph', title: 'Текст', description: 'Обычный абзац текста', icon: '¶', category: 'basic' },
  { type: 'heading1', title: 'Заголовок 1', description: 'Крупный заголовок раздела', icon: 'H1', shortcut: 'Ctrl+1', category: 'basic' },
  { type: 'heading2', title: 'Заголовок 2', description: 'Заголовок подраздела', icon: 'H2', shortcut: 'Ctrl+2', category: 'basic' },
  { type: 'heading3', title: 'Заголовок 3', description: 'Малый заголовок', icon: 'H3', shortcut: 'Ctrl+3', category: 'basic' },

  // Structure
  { type: 'list', title: 'Список', description: 'Маркированный список', icon: '•', category: 'structure' },
  { type: 'numbered-list', title: 'Нумерованный список', description: 'Пронумерованный список', icon: '1.', category: 'structure' },
  { type: 'quote', title: 'Цитата', description: 'Выделенная цитата', icon: '❝', category: 'structure' },
  { type: 'callout', title: 'Выноска', description: 'Важная информация', icon: 'info', category: 'structure' },
  { type: 'divider', title: 'Разделитель', description: 'Горизонтальная линия', icon: '—', category: 'structure' },

  // Media
  { type: 'image', title: 'Изображение', description: 'Картинка или фото', icon: 'img', category: 'media' },
  { type: 'file', title: 'Файл', description: 'Документ, архив или другой файл', icon: 'file', category: 'media' },
  { type: 'youtube', title: 'YouTube', description: 'Видео с YouTube', icon: 'yt', category: 'media' },

  // Advanced
  { type: 'code', title: 'Код', description: 'Блок кода с подсветкой', icon: '</>', category: 'advanced' },
];

