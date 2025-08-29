import { useState, useEffect } from 'react';
import { DocumentationSection } from '@/types/documentation';

export function useDocumentationData() {
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocumentation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/documentation', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки документации:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentation();
  }, []);

  return {
    sections,
    setSections,
    loading,
    loadDocumentation
  };
}
