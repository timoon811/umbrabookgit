import { useState, useEffect } from 'react';

export interface CourseSection {
  id: string;
  name: string;
  key: string;
  description: string | null;
  emoji: string;
  order: number;
  isVisible: boolean;
  pages: CoursePage[];
}

export interface CoursePage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  content: string | null;
  blocks: string | null;
  sectionId: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useCoursesData() {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/courses', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return {
    sections,
    setSections,
    loading,
    loadCourses
  };
}
