"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  type: 'documentation' | 'course';
  url: string;
  displayTitle?: string;
  section?: string;
}

export default function SearchBox() {
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Предотвращаем гидратацию до монтирования компонента
  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);

  // Функция поиска
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Обработчик изменения поискового запроса
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      handleSearch(query);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Обработчик клика по результату
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setShowResults(false);
    setSearchQuery("");
  };

  // Обработчик клавиши Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      }
    }
  };

  // Не рендерим ничего до монтирования на клиенте
  if (!isClient) {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="h-10 w-80 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-16 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
          placeholder="Поиск по документации и курсам..."
          readOnly
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500">
            K
          </kbd>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="h-10 w-80 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-16 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
          placeholder="Поиск по документации и курсам..."
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowResults(false);
            }}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500">
            K
          </kbd>
        </div>
      </div>

      {/* Результаты поиска */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Поиск...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.displayTitle || result.title}
                  </div>
                  {result.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {result.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {result.type === 'documentation' ? '📚 Документация' : '🎓 Курс'}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Ничего не найдено
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}



