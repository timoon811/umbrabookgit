import { useState, useEffect } from 'react';
import { DocumentationSection } from '@/types/documentation';

export function useDocumentationData(projectId?: string) {
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocumentation = async () => {
    try {
      setLoading(true);
      console.log('📚 Загружаем документацию для проекта:', projectId);
      
      if (!projectId) {
        console.log('⚠️ Проект не выбран, очищаем разделы');
        setSections([]);
        setLoading(false);
        return;
      }

      const url = `/api/admin/documentation?projectId=${projectId}`;
      console.log('🔗 API URL:', url);
      const response = await fetch(url, {
        cache: 'no-store'
      });
      
      console.log('📡 Ответ загрузки документации:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Данные документации:', data);
        setSections(data.sections || []);
      } else {
        const errorData = await response.text();
        console.error('❌ Ошибка загрузки документации:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки документации:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentation();
  }, [projectId]);

  return {
    sections,
    setSections,
    loading,
    loadDocumentation
  };
}
