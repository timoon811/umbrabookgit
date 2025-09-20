import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentationSection } from '@/types/documentation';

export function useDocumentationData(projectId?: string) {
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadDocumentation = useCallback(async () => {
    try {
      // ИСПРАВЛЕНО: Отменяем предыдущий запрос если есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      setLoading(true);
      console.log('📚 Загружаем документацию для проекта:', projectId);
      
      // ИСПРАВЛЕНО: Всегда очищаем разделы сначала
      setSections([]);
      
      if (!projectId) {
        console.log('⚠️ Проект не выбран, оставляем разделы пустыми');
        setLoading(false);
        return;
      }

      const url = `/api/admin/documentation?projectId=${projectId}`;
      console.log('🔗 API URL:', url);
      const response = await fetch(url, {
        signal: abortController.signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📡 Ответ загрузки документации:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Данные документации:', data);
        console.log('📂 Разделов получено:', data.sections?.length || 0);
        setSections(data.sections || []);
      } else {
        const errorData = await response.text();
        console.error('❌ Ошибка загрузки документации:', response.status, errorData);
        setSections([]); // Очищаем при ошибке
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Запрос отменен (переключение проекта)');
        return; // Не обновляем состояние при отмене
      }
      console.error('❌ Ошибка загрузки документации:', error);
      setSections([]); // Очищаем при ошибке
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    console.log('🔄 useEffect triggered: projectId изменен на', projectId);
    loadDocumentation();
    
    // Cleanup function для отмены запроса при размонтировании
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [projectId, loadDocumentation]);

  return {
    sections,
    setSections,
    loading,
    loadDocumentation
  };
}
