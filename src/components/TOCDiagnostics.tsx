'use client';

import { useState, useEffect } from 'react';

interface TOCDiagnosticsProps {
  tocItems: Array<{ id: string; text: string; depth: number }>;
  activeId: string;
  enabled?: boolean;
}

interface HeadingInfo {
  id: string;
  text: string;
  top: number;
  bottom: number;
  offsetTop: number;
  isVisible: boolean;
  isInViewport: boolean;
  distanceFromTop: number;
}

export default function TOCDiagnostics({ tocItems, activeId, enabled = false }: TOCDiagnosticsProps) {
  const [headingsInfo, setHeadingsInfo] = useState<HeadingInfo[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    const updateHeadingsInfo = () => {
      const headerOffset = 120;
      const info: HeadingInfo[] = tocItems.map(item => {
        const element = document.getElementById(item.id);
        if (!element) {
          return {
            id: item.id,
            text: item.text,
            top: 0,
            bottom: 0,
            offsetTop: 0,
            isVisible: false,
            isInViewport: false,
            distanceFromTop: 0
          };
        }

        const rect = element.getBoundingClientRect();
        const distanceFromTop = rect.top - headerOffset;
        
        return {
          id: item.id,
          text: item.text,
          top: rect.top,
          bottom: rect.bottom,
          offsetTop: element.offsetTop,
          isVisible: rect.top >= 0 && rect.bottom <= window.innerHeight,
          isInViewport: rect.top < window.innerHeight && rect.bottom > 0,
          distanceFromTop
        };
      });

      setHeadingsInfo(info);
      setScrollPosition(window.scrollY);
      setViewportHeight(window.innerHeight);
    };

    const handleScroll = () => {
      updateHeadingsInfo();
    };

    // Первоначальное обновление
    updateHeadingsInfo();

    // Слушаем скролл
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeadingsInfo);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeadingsInfo);
    };
  }, [tocItems, enabled]);

  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const activeHeading = headingsInfo.find(h => h.id === activeId);

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md font-mono text-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-yellow-400">TOC Diagnostics</h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-3">
          {/* Общая информация */}
          <div className="border-b border-gray-700 pb-2">
            <div>Scroll: {scrollPosition}px</div>
            <div>Viewport: {viewportHeight}px</div>
            <div>Active: {activeId || 'none'}</div>
            <div>Headers: {headingsInfo.length}</div>
          </div>

          {/* Информация об активном заголовке */}
          {activeHeading && (
            <div className="border-b border-gray-700 pb-2">
              <div className="text-green-400 font-bold">Active Heading:</div>
              <div>ID: {activeHeading.id}</div>
              <div>Distance from top: {Math.round(activeHeading.distanceFromTop)}px</div>
              <div className="flex items-center gap-2">
                Visible: 
                {activeHeading.isVisible ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                In viewport: 
                {activeHeading.isInViewport ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Список всех заголовков */}
          <div className="max-h-64 overflow-y-auto">
            <div className="text-blue-400 font-bold mb-1">All Headings:</div>
            {headingsInfo.map((heading, index) => (
              <div
                key={heading.id}
                className={`p-1 rounded mb-1 ${
                  heading.id === activeId
                    ? 'bg-green-800 text-green-200'
                    : heading.isInViewport
                    ? 'bg-blue-800 text-blue-200'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate flex-1">
                    {index + 1}. {heading.text.substring(0, 20)}...
                  </span>
                  <span className="ml-2">
                    {heading.id === activeId ? (
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : heading.isInViewport ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Top: {Math.round(heading.top)}px | 
                  Dist: {Math.round(heading.distanceFromTop)}px
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки для тестирования */}
          <div className="border-t border-gray-700 pt-2">
            <div className="text-purple-400 font-bold mb-1">Test Actions:</div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
              >
                Top
              </button>
              <button
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
              >
                Bottom
              </button>
              <button
                onClick={() => {
                  console.log({
                    headingsInfo,
                    activeId,
                    scrollPosition,
                    viewportHeight
                  });
                }}
                className="px-2 py-1 bg-orange-600 hover:bg-orange-500 rounded text-xs"
              >
                Log Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
