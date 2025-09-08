'use client';

import { useTableOfContents } from '@/hooks/useTableOfContents';
import TOCDiagnostics from './TOCDiagnostics';

interface TableOfContentsProps {
  content?: string;
  pageType?: 'article' | 'course';
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const { tocItems, activeId, scrollToHeading } = useTableOfContents({
    enabled: content === 'dynamic',
    container: '#article-content',
    headingSelector: 'h1, h2, h3'
  });

  // Обработчик клика по элементу оглавления
  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    scrollToHeading(id);
  };

  if (tocItems.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <div className="text-xs mb-2">
          Заголовки отсутствуют
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-red-500 space-y-1">
            <div>Debug: content = &quot;{content}&quot;</div>
            <div>Debug: поиск в #article-content</div>
            <button 
              onClick={() => {
                const articleContent = document.getElementById('article-content');
                const headings = document.querySelectorAll('#article-content h1, #article-content h2, #article-content h3');
                console.log('TOC Debug Info:');
                console.log('- article-content элемент:', articleContent);
                console.log('- найдено заголовков:', headings.length);
                console.log('- content:', content);
                headings.forEach((h, i) => console.log(`  ${i+1}. ${h.tagName}: "${h.textContent?.trim()}"`));
              }}
              className="text-xs bg-red-100 px-2 py-1 rounded hover:bg-red-200"
            >
              Debug заголовки
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <nav className="text-sm">
        <ul className="space-y-1">
          {tocItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(item.id, e)}
                className={`block py-1 px-2 text-xs transition-colors rounded hover:bg-gray-100 dark:hover:bg-[#0a0a0a] ${
                  activeId === item.id
                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-[#0a0a0a] font-medium border-l-2 border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                } ${
                  item.depth === 2
                    ? 'pl-4'
                    : item.depth === 3
                    ? 'pl-6'
                    : ''
                }`}
                title={item.text}
              >
                <span className="line-clamp-2">
                  {item.text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Диагностика для режима разработки */}
      <TOCDiagnostics 
        tocItems={tocItems} 
        activeId={activeId} 
        enabled={process.env.NODE_ENV === 'development'} 
      />
    </>
  );
}
