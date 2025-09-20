"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeFileUrl, isImageFile } from '@/lib/file-utils';
import { Block } from '@/types/editor';
import { parseMarkdownToBlocks } from '@/lib/block-utils';

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


  // Функция для вычисления номера элемента нумерованного списка
  const getListItemNumber = (currentIndex: number): number => {
    let number = 1;
    
    // Идем назад от текущего элемента, считаем элементы нумерованного списка
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevBlock = blocks[i];
      if (prevBlock.type === 'numbered-list') {
        number++;
      } else {
        // Если встретили блок другого типа, прерываем подсчет
        break;
      }
    }
    
    return number;
  };

  const renderBlock = (block: Block, index: number) => {
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
      // Обработка встроенного форматирования с сохранением пробелов и переносов
      let processed = content;
      
      // УСИЛЕННАЯ защита от XSS - удаляем опасные конструкции
      processed = processed
        .replace(/javascript:/gi, '[BLOCKED-JS-PROTOCOL]')
        .replace(/vbscript:/gi, '[BLOCKED-VB-PROTOCOL]')
        .replace(/data:[^;]*;base64/gi, '[BLOCKED-DATA-URI]')
        .replace(/on\w+\s*=/gi, '[BLOCKED-EVENT-HANDLER]')
        .replace(/alert\s*\(/gi, '[BLOCKED-ALERT]')
        .replace(/eval\s*\(/gi, '[BLOCKED-EVAL]')
        .replace(/expression\s*\(/gi, '[BLOCKED-EXPRESSION]')
        .replace(/<script[^>]*>/gi, '[BLOCKED-SCRIPT-TAG]')
        .replace(/<\/script>/gi, '[/BLOCKED-SCRIPT-TAG]')
        .replace(/<iframe[^>]*>/gi, '[BLOCKED-IFRAME]')
        .replace(/<\/iframe>/gi, '[/BLOCKED-IFRAME]')
        .replace(/<object[^>]*>/gi, '[BLOCKED-OBJECT]')
        .replace(/<embed[^>]*>/gi, '[BLOCKED-EMBED]');
      
      // ОСНОВНОЕ экранирование HTML символов для безопасности
      processed = processed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;'); // Дополнительная защита от закрытия тегов
      
      // Жирный текст (с дополнительным экранированием)
      processed = processed.replace(/\*\*(.*?)\*\*/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<strong>${safeContent}</strong>`;
      });
      
      // Курсив (с дополнительным экранированием)
      processed = processed.replace(/\*(.*?)\*/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<em>${safeContent}</em>`;
      });
      
      // Подчеркивание (с дополнительным экранированием)
      processed = processed.replace(/__(.*?)__/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<u>${safeContent}</u>`;
      });
      
      // Зачеркивание (с дополнительным экранированием)
      processed = processed.replace(/~~(.*?)~~/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<del>${safeContent}</del>`;
      });
      
      // Выделение (с дополнительным экранированием)
      processed = processed.replace(/==(.*?)==/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<mark>${safeContent}</mark>`;
      });
      
      // Код (с дополнительным экранированием)
      processed = processed.replace(/`(.*?)`/g, (match, content) => {
        const safeContent = content.replace(/[<>"']/g, (char) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return escapeMap[char] || char;
        });
        return `<code class="bg-gray-100 dark:bg-[#0a0a0a] px-1 py-0.5 rounded text-sm">${safeContent}</code>`;
      });

      // Заменяем переносы строк на <br> для сохранения форматирования
      processed = processed.replace(/\n/g, '<br>');

      return <span 
        dangerouslySetInnerHTML={{ __html: processed }} 
        style={{ whiteSpace: 'pre-wrap' }}
      />;
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
            <p className={`text-gray-700 dark:text-gray-300 italic ${getTextClasses()}`} style={{ ...getTextStyles(), whiteSpace: 'pre-wrap' }}>
              {processContent(block.content)}
            </p>
          </blockquote>
        );

      case 'list':
        return (
          <div key={block.id} className="flex items-start gap-3 mb-2">
            <span className="text-gray-400 leading-relaxed flex-shrink-0">•</span>
            <p className={`text-gray-900 dark:text-white leading-relaxed ${getTextClasses()}`} style={{ ...getTextStyles(), whiteSpace: 'pre-wrap' }}>
              {processContent(block.content)}
            </p>
          </div>
        );

      case 'numbered-list':
        return (
          <div key={block.id} className="flex items-start gap-3 mb-2">
            <span className="text-gray-400 leading-relaxed flex-shrink-0 min-w-0">{getListItemNumber(index)}.</span>
            <p className={`text-gray-900 dark:text-white leading-relaxed ${getTextClasses()}`} style={{ ...getTextStyles(), whiteSpace: 'pre-wrap' }}>
              {processContent(block.content)}
            </p>
          </div>
        );

      case 'code':
        return (
          <div key={block.id} className="bg-gray-100 dark:bg-[#0a0a0a] rounded-lg border mb-6">
            {block.metadata?.language && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                {block.metadata.language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto" style={{ whiteSpace: 'pre-wrap' }}>
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
                fallback.className = 'bg-gray-100 dark:bg-[#0a0a0a] rounded-lg p-8 text-center text-gray-500 dark:text-gray-400';
                fallback.innerHTML = `<div><svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div class="mt-2 text-sm">Изображение не загружено</div>`;
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
          if (fileName?.includes('.pdf')) return (
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
          if (fileName?.includes('.doc') || fileName?.includes('.docx')) return (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-5m-1.414-1.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          );
          if (fileName?.includes('.xls') || fileName?.includes('.xlsx')) return (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          );
          if (fileName?.includes('.ppt') || fileName?.includes('.pptx')) return (
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v9.5M7 4V3a1 1 0 00-1 1v9.5m0 0a2 2 0 002 2h8a2 2 0 002-2M7 4h10" />
            </svg>
          );
          if (fileName?.includes('.zip') || fileName?.includes('.rar') || fileName?.includes('.7z')) return (
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          );
          if (fileName?.includes('.mp3') || fileName?.includes('.wav')) return (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          );
          if (fileName?.includes('.mp4') || fileName?.includes('.webm')) return (
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          );
          if (fileName?.includes('.txt')) return (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          );
          if (fileName?.includes('.json')) return (
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          );
          if (fileName?.includes('.csv')) return (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          );
          return (
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          );
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
          info: (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          warning: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.348 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          error: (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          success: (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
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
            <div className={getTextClasses()} style={{ ...getTextStyles(), whiteSpace: 'pre-wrap' }}>
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
            style={{ ...getTextStyles(), whiteSpace: 'pre-wrap' }}
          >
            {processContent(block.content)}
          </p>
        );
    }
  };

  return (
    <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
