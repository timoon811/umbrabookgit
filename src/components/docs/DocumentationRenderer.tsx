"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeFileUrl, isImageFile } from '@/lib/file-utils';

interface Block {
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
  };
}

interface DocumentationRendererProps {
  content: string;
}

export default function DocumentationRenderer({ content }: DocumentationRendererProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Функция для генерации slug ID (такая же как в TableOfContents)
  const generateSlugId = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  useEffect(() => {
    const parsedBlocks = parseMarkdownToBlocks(content);
    setBlocks(parsedBlocks);
  }, [content]);

  const parseMarkdownToBlocks = (markdown: string): Block[] => {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // YouTube ссылки
      const youtubeMatch = line.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (youtubeMatch) {
        blocks.push({
          id: `block-${i}`,
          type: 'youtube',
          content: line,
          metadata: { youtubeId: youtubeMatch[1] }
        });
        continue;
      }

      // Заголовки
      if (line.startsWith('# ')) {
        blocks.push({
          id: `block-${i}`,
          type: 'heading1',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push({
          id: `block-${i}`,
          type: 'heading2',
          content: line.substring(3),
          metadata: {}
        });
        continue;
      }

      if (line.startsWith('### ')) {
        blocks.push({
          id: `block-${i}`,
          type: 'heading3',
          content: line.substring(4),
          metadata: {}
        });
        continue;
      }

      // Цитаты
      if (line.startsWith('> ')) {
        blocks.push({
          id: `block-${i}`,
          type: 'quote',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      // Изображения
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        blocks.push({
          id: `block-${i}`,
          type: 'image',
          content: imageMatch[2],
          metadata: { url: imageMatch[2], alt: imageMatch[1], caption: imageMatch[1] }
        });
        continue;
      }

      // Файлы
      const fileMatch = line.match(/\[📎\s*([^\]]+)\]\(([^)]+)\)/);
      if (fileMatch) {
        blocks.push({
          id: `block-${i}`,
          type: 'file',
          content: fileMatch[2],
          metadata: { url: fileMatch[2], name: fileMatch[1] }
        });
        continue;
      }

      // Списки
      if (line.match(/^[-*] /)) {
        blocks.push({
          id: `block-${i}`,
          type: 'list',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      if (line.match(/^\d+\. /)) {
        blocks.push({
          id: `block-${i}`,
          type: 'numbered-list',
          content: line.replace(/^\d+\. /, ''),
          metadata: {}
        });
        continue;
      }

      // Внутренние ссылки на страницы
      const internalLinkMatch = line.match(/\[([^\]]+)\]\(\/docs\/([^)]+)\)/);
      if (internalLinkMatch) {
        blocks.push({
          id: `block-${i}`,
          type: 'internal-link',
          content: internalLinkMatch[1],
          metadata: { internalPageId: internalLinkMatch[2] }
        });
        continue;
      }

      // Внешние ссылки
      const externalLinkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (externalLinkMatch) {
        blocks.push({
          id: `block-${i}`,
          type: 'external-link',
          content: externalLinkMatch[1],
          metadata: { linkUrl: externalLinkMatch[2] }
        });
        continue;
      }

      // Обычный текст
      blocks.push({
        id: `block-${i}`,
        type: 'paragraph',
        content: line,
        metadata: {}
      });
    }

    return blocks;
  };

  const renderBlock = (block: Block) => {
    const getAlignmentClass = () => {
      const alignment = block.metadata?.alignment || 'left';
      switch (alignment) {
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        default: return 'text-left';
      }
    };

    const getTextStyles = () => {
      const styles: React.CSSProperties = {};
      const metadata = block.metadata;

      if (metadata?.color) styles.color = metadata.color;
      if (metadata?.backgroundColor) styles.backgroundColor = metadata.backgroundColor;
      if (metadata?.fontSize) {
        switch (metadata.fontSize) {
          case 'small': styles.fontSize = '0.875rem'; break;
          case 'large': styles.fontSize = '1.25rem'; break;
          case 'xlarge': styles.fontSize = '1.5rem'; break;
          default: styles.fontSize = '1rem';
        }
      }

      return styles;
    };

    const getTextClasses = () => {
      const classes = [];
      const metadata = block.metadata;

      if (metadata?.bold) classes.push('font-bold');
      if (metadata?.italic) classes.push('italic');
      if (metadata?.underline) classes.push('underline');
      if (metadata?.strikethrough) classes.push('line-through');
      if (metadata?.highlight) classes.push('bg-yellow-200 dark:bg-yellow-800');

      return classes.join(' ');
    };

    const processContent = (content: string): React.ReactNode => {
      // Обработка встроенного форматирования
      let processed = content;
      
      // Жирный текст
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Курсив
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Подчеркивание
      processed = processed.replace(/__(.*?)__/g, '<u>$1</u>');
      
      // Зачеркивание
      processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');
      
      // Выделение
      processed = processed.replace(/==(.*?)==/g, '<mark>$1</mark>');
      
      // Код
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');

      return <span dangerouslySetInnerHTML={{ __html: processed }} />;
    };

    switch (block.type) {
      case 'heading1':
        return (
          <h1 
            key={block.id}
            id={generateSlugId(block.content)}
            className={`text-3xl font-bold text-gray-900 dark:text-white mb-6 ${getAlignmentClass()} ${getTextClasses()}`}
            style={getTextStyles()}
          >
            {processContent(block.content)}
          </h1>
        );

      case 'heading2':
        return (
          <h2 
            key={block.id}
            id={generateSlugId(block.content)}
            className={`text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8 ${getAlignmentClass()} ${getTextClasses()}`}
            style={getTextStyles()}
          >
            {processContent(block.content)}
          </h2>
        );

      case 'heading3':
        return (
          <h3 
            key={block.id}
            id={generateSlugId(block.content)}
            className={`text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6 ${getAlignmentClass()} ${getTextClasses()}`}
            style={getTextStyles()}
          >
            {processContent(block.content)}
          </h3>
        );

      case 'quote':
        return (
          <blockquote 
            key={block.id}
            className={`border-l-4 border-gray-500 pl-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg mb-6 ${getAlignmentClass()}`}
          >
            <p className={`text-gray-700 dark:text-gray-300 italic ${getTextClasses()}`} style={getTextStyles()}>
              {processContent(block.content)}
            </p>
          </blockquote>
        );

      case 'list':
        return (
          <div key={block.id} className="flex items-start gap-3 mb-2">
            <span className="text-gray-400 mt-1">•</span>
            <p className={`text-gray-900 dark:text-white ${getTextClasses()}`} style={getTextStyles()}>
              {processContent(block.content)}
            </p>
          </div>
        );

      case 'numbered-list':
        return (
          <div key={block.id} className="flex items-start gap-3 mb-2">
            <span className="text-gray-400 mt-1">1.</span>
            <p className={`text-gray-900 dark:text-white ${getTextClasses()}`} style={getTextStyles()}>
              {processContent(block.content)}
            </p>
          </div>
        );

      case 'code':
        return (
          <div key={block.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg border mb-6">
            {block.metadata?.language && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                {block.metadata.language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {block.content}
              </code>
            </pre>
          </div>
        );

      case 'image':
        const imageSrc = normalizeFileUrl(block.metadata?.url || block.content);
        return (
          <figure key={block.id} className={`mb-6 ${getAlignmentClass()}`}>
            <Image 
              src={imageSrc} 
              alt={block.metadata?.alt || ''}
              width={800}
              height={600}
              className="max-w-full h-auto rounded-lg shadow-sm"
              onError={(e) => {
                // Fallback при ошибке загрузки
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400';
                fallback.innerHTML = `<div>🖼️</div><div class="mt-2 text-sm">Изображение не загружено</div>`;
                target.parentNode?.appendChild(fallback);
              }}
              unoptimized={true}
            />
            {block.metadata?.caption && (
              <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                {block.metadata.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'youtube':
        const youtubeId = block.metadata?.youtubeId;
        return (
          <figure key={block.id} className="mb-6">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allowFullScreen
                title="YouTube video"
              />
            </div>
            {block.metadata?.caption && (
              <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                {block.metadata.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'file':
        const getFileIcon = (fileName: string) => {
          if (fileName?.includes('.pdf')) return '📄';
          if (fileName?.includes('.doc') || fileName?.includes('.docx')) return '📝';
          if (fileName?.includes('.xls') || fileName?.includes('.xlsx')) return '📊';
          if (fileName?.includes('.ppt') || fileName?.includes('.pptx')) return '📽';
          if (fileName?.includes('.zip') || fileName?.includes('.rar') || fileName?.includes('.7z')) return '🗜';
          if (fileName?.includes('.mp3') || fileName?.includes('.wav')) return '🎵';
          if (fileName?.includes('.mp4') || fileName?.includes('.webm')) return '🎬';
          if (fileName?.includes('.txt')) return '📋';
          if (fileName?.includes('.json')) return '📋';
          if (fileName?.includes('.csv')) return '📊';
          return '📎';
        };

        return (
          <div key={block.id} className="mb-4">
            <a 
              href={block.metadata?.url || block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors group"
            >
              <div className="text-2xl">
                {getFileIcon(block.metadata?.name || block.content)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                  {block.metadata?.name || 'Скачать файл'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Нажмите для открытия
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        );

      case 'internal-link':
        return (
          <div key={block.id} className="mb-2">
            <Link 
              href={`/docs/${block.metadata?.internalPageId}`}
              className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {block.content}
            </Link>
          </div>
        );

      case 'external-link':
        return (
          <div key={block.id} className="mb-2">
            <a 
              href={block.metadata?.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {block.content}
            </a>
          </div>
        );

      case 'callout':
        const calloutStyles = {
          info: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
          error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        };
        const calloutType = block.metadata?.calloutType || 'info';
        const calloutIcons = {
          info: '💡',
          warning: '⚠️',
          error: '❌',
          success: '✅'
        };

        return (
          <div key={block.id} className={`border rounded-lg p-4 mb-6 ${calloutStyles[calloutType]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{calloutIcons[calloutType]}</span>
              <span className="font-medium">
                {calloutType === 'info' && 'Информация'}
                {calloutType === 'warning' && 'Предупреждение'}
                {calloutType === 'error' && 'Ошибка'}
                {calloutType === 'success' && 'Успех'}
              </span>
            </div>
            <div className={getTextClasses()} style={getTextStyles()}>
              {processContent(block.content)}
            </div>
          </div>
        );

      case 'divider':
        return (
          <div key={block.id} className="py-6">
            <hr className="border-gray-300 dark:border-gray-600" />
          </div>
        );

      default: // paragraph
        return (
          <p 
            key={block.id}
            className={`text-gray-900 dark:text-white mb-4 leading-relaxed ${getAlignmentClass()} ${getTextClasses()}`}
            style={getTextStyles()}
          >
            {processContent(block.content)}
          </p>
        );
    }
  };

  return (
    <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
      {blocks.map(renderBlock)}
    </div>
  );
}
