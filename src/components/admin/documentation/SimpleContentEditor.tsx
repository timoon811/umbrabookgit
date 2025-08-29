import { DocumentationPage } from '@/types/documentation';

interface SimpleContentEditorProps {
  selectedPage: DocumentationPage | null;
  onUpdateContent: (content: string) => void;
  onDeletePage?: (pageId: string) => void;
  saving: boolean;
}

export default function SimpleContentEditor({
  selectedPage,
  onUpdateContent,
  onDeletePage,
  saving
}: SimpleContentEditorProps) {
  if (!selectedPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Выберите страницу
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Кликните на страницу в левом меню, чтобы начать редактирование
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Минимальная шапка как в GitBook */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              selectedPage.isPublished ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedPage.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
                Сохранение...
              </div>
            )}
            
            {/* Кнопка удаления страницы */}
            {onDeletePage && (
              <button
                onClick={() => onDeletePage(selectedPage.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Удалить страницу"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Редактор контента в стиле GitBook */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <textarea
            value={selectedPage.content || ''}
            onChange={(e) => onUpdateContent(e.target.value)}
            className="w-full h-full resize-none border-none outline-none px-6 py-6 text-gray-900 dark:text-white bg-transparent text-base leading-relaxed placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Начните писать..."
            style={{
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              lineHeight: '1.7'
            }}
          />
        </div>
      </div>
    </div>
  );
}
