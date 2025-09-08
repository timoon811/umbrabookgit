"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Block } from '@/types/editor';
// Все быстрые действия и хоткеи отключены

interface BlockEditorProps {
  block: Block;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
  onAddBlock: (type: string, afterId: string) => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function BlockEditor({
  block,
  isActive,
  onFocus,
  onBlur,
  onUpdate,
  onDelete,
  onAddBlock,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: BlockEditorProps) {
  // Управляющие оверлеи и меню действий убраны
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = (content: string) => {
    onUpdate({ ...block, content });
  };

  const updateMetadata = (metadata: Partial<Block['metadata']>) => {
    onUpdate({
      ...block,
      metadata: { ...block.metadata, ...metadata }
    });
  };

  // Хендлеры клавиатуры отключены, чтобы не было хоткеев

  const renderBlockContent = () => {
    const commonProps = {
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateContent(e.target.value),
      onFocus,
      onBlur,
      // onKeyDown отключен: без хоткеев
      placeholder: getPlaceholder(),
      className: `w-full bg-transparent border-none outline-none resize-none ${getBlockStyles()}`
    };

    switch (block.type) {
      case 'heading1':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-3xl font-bold text-gray-900 dark:text-gray-100`}
          />
        );
      
      case 'heading2':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-2xl font-semibold text-gray-900 dark:text-gray-100`}
          />
        );
      
      case 'heading3':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-xl font-medium text-gray-900 dark:text-gray-100`}
          />
        );

      case 'quote':
        return (
          <div className="border-l-4 border-gray-400 dark:border-gray-600 pl-4 bg-gray-100/50 dark:bg-white/5 rounded-r-md">
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-700 dark:text-gray-300 italic min-h-[80px]`}
              rows={3}
            />
          </div>
        );

      case 'code':
        return (
          <div className="bg-gray-100 dark:bg-[#0a0a0a] rounded-md border">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <select
                value={block.metadata?.language || 'text'}
                onChange={(e) => updateMetadata({ language: e.target.value })}
                className="text-xs bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
              >
                <option value="text">Plain Text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} font-mono text-sm text-gray-900 dark:text-gray-100 p-4 min-h-[120px]`}
              rows={6}
            />
          </div>
        );

      case 'list':
        return (
          <div className="flex items-start">
            <span className="text-gray-400 mr-3 mt-1">•</span>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-900 dark:text-gray-100 flex-1 min-h-[24px]`}
              rows={1}
            />
          </div>
        );

      case 'numbered-list':
        return (
          <div className="flex items-start">
            <span className="text-gray-400 mr-3 mt-1">1.</span>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-900 dark:text-gray-100 flex-1 min-h-[24px]`}
              rows={1}
            />
          </div>
        );

      case 'callout':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">💡</span>
              <input
                type="text"
                value={block.metadata?.caption || 'Callout'}
                onChange={(e) => updateMetadata({ caption: e.target.value })}
                className="font-medium bg-transparent border-none outline-none text-yellow-800 dark:text-yellow-200"
                placeholder="Callout title"
              />
            </div>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-yellow-800 dark:text-yellow-200 min-h-[60px]`}
              rows={2}
            />
          </div>
        );

      case 'image':
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
            {block.metadata?.url ? (
              <div>
                <Image 
                  src={block.metadata.url} 
                  alt={block.metadata.alt || ''}
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded"
                  unoptimized={true}
                />
                <input
                  type="text"
                  value={block.metadata.caption || ''}
                  onChange={(e) => updateMetadata({ caption: e.target.value })}
                  placeholder="Image caption (optional)"
                  className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📷</div>
                <input
                  type="url"
                  value={block.content}
                  onChange={(e) => {
                    updateContent(e.target.value);
                    updateMetadata({ url: e.target.value });
                  }}
                  placeholder="Paste image URL..."
                  className="w-full text-center bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
                />
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div className="py-4">
            <hr className="border-gray-300 dark:border-gray-600" />
          </div>
        );

      default: // paragraph
        return (
          <textarea 
            {...commonProps}
            className={`${commonProps.className} text-gray-900 dark:text-gray-100 min-h-[24px] leading-relaxed`}
            rows={1}
          />
        );
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'quote': return 'Quote';
      case 'code': return 'Code';
      case 'list': return 'List item';
      case 'numbered-list': return 'List item';
      case 'callout': return 'Callout content';
      case 'image': return 'Image URL';
      default: return 'Type / for commands';
    }
  };

  const getBlockStyles = () => {
    const alignment = block.metadata?.alignment || 'left';
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }[alignment];

    return `placeholder-gray-400 ${alignmentClass}`;
  };

  return (
    <div 
      className="group relative mb-2 rounded-lg"
    >

      {/* Block content */}
      <div className="px-2 py-1">
        {renderBlockContent()}
      </div>

      {/* Меню выбора типа блока убрано */}
    </div>
  );
}
