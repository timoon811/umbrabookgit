"use client";

import { 
  Type, Hash, List, Quote, Code, Image as ImageIcon,
  Video, Table, Minus, FileText, AlertCircle, CheckSquare,
  Heading1, Heading2, Heading3, PlusCircle, Columns
} from 'lucide-react';

export interface BlockType {
  type: string;
  icon: React.ElementType;
  label: string;
  description: string;
  category: 'basic' | 'media' | 'advanced';
}

export const blockTypes: BlockType[] = [
  // Basic blocks
  { type: 'paragraph', icon: Type, label: 'Text', description: 'Start writing with plain text', category: 'basic' },
  { type: 'heading1', icon: Heading1, label: 'Heading 1', description: 'Big section heading', category: 'basic' },
  { type: 'heading2', icon: Heading2, label: 'Heading 2', description: 'Medium section heading', category: 'basic' },
  { type: 'heading3', icon: Heading3, label: 'Heading 3', description: 'Small section heading', category: 'basic' },
  { type: 'list', icon: List, label: 'Bulleted list', description: 'Create a simple bulleted list', category: 'basic' },
  { type: 'numbered-list', icon: List, label: 'Numbered list', description: 'Create a numbered list', category: 'basic' },
  { type: 'quote', icon: Quote, label: 'Quote', description: 'Capture a quote', category: 'basic' },
  { type: 'divider', icon: Minus, label: 'Divider', description: 'Visually divide blocks', category: 'basic' },
  
  // Media blocks
  { type: 'image', icon: ImageIcon, label: 'Image', description: 'Upload or embed with a link', category: 'media' },
  { type: 'video', icon: Video, label: 'Video', description: 'Embed from YouTube, Vimeo, etc.', category: 'media' },
  
  // Advanced blocks
  { type: 'code', icon: Code, label: 'Code', description: 'Capture a code snippet', category: 'advanced' },
  { type: 'table', icon: Table, label: 'Table', description: 'Add a table', category: 'advanced' },
  { type: 'callout', icon: AlertCircle, label: 'Callout', description: 'Make writing stand out', category: 'advanced' },
  { type: 'toggle', icon: CheckSquare, label: 'Toggle list', description: 'Toggleable content', category: 'advanced' },
  { type: 'columns', icon: Columns, label: 'Columns', description: 'Create columns', category: 'advanced' },
];

interface BlockTypeMenuProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function BlockTypeMenu({ onSelect, onClose, position }: BlockTypeMenuProps) {
  const categories = {
    basic: blockTypes.filter(b => b.category === 'basic'),
    media: blockTypes.filter(b => b.category === 'media'),
    advanced: blockTypes.filter(b => b.category === 'advanced'),
  };

  return (
    <div 
      className="absolute z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 max-h-96 overflow-y-auto"
      style={position ? { left: position.x, top: position.y } : {}}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Add a block
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      </div>

      {Object.entries(categories).map(([categoryName, blocks]) => (
        <div key={categoryName}>
          <div className="px-4 py-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {categoryName}
            </h4>
          </div>
          
          {blocks.map((blockType) => (
            <button
              key={blockType.type}
              onClick={() => {
                onSelect(blockType.type);
                onClose();
              }}
              className="w-full flex items-start space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <blockType.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {blockType.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {blockType.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
