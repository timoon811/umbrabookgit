"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Block } from "@/components/editor/BlockEditor";
import ModernArticleEditor from "@/components/editor/ModernArticleEditor";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  isPublished: boolean;
}

interface CourseSection {
  id: string;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  pages: CoursePage[];
}

interface CoursePage {
  id: string;
  title: string;
  content: string;
  blocks?: Block[];
  order: number;
  isPublished: boolean;
}

interface CourseEditorData {
  id?: string;
  title: string;
  description: string;
  blocks: Block[];
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export default function CourseEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<CoursePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Состояние для создания новых элементов
  const [showNewSection, setShowNewSection] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");

  // Новое состояние для блочного редактора
  const [editorData, setEditorData] = useState<CourseEditorData>({
    title: '',
    description: '',
    blocks: [{ id: '1', type: 'paragraph', content: '' }],
    category: 'courses',
    tags: [],
    status: 'draft'
  });
  const [useBlockEditor, setUseBlockEditor] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [params.id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, sectionsRes] = await Promise.all([
        fetch(`/api/admin/courses/${params.id}`),
        fetch(`/api/admin/courses/${params.id}/sections`)
      ]);

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData.sections || []);
        
        // Выбираем первый раздел и первую страницу по умолчанию
        if (sectionsData.sections.length > 0) {
          const firstSection = sectionsData.sections[0];
          setSelectedSection(firstSection.id);
          
          if (firstSection.pages.length > 0) {
            const firstPage = firstSection.pages[0];
            setSelectedPage(firstPage.id);
            setCurrentPage(firstPage);
          }
        }
      }
    } catch (error) {
      setError("Ошибка загрузки данных курса");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section && section.pages.length > 0) {
      const firstPage = section.pages[0];
      setSelectedPage(firstPage.id);
      setCurrentPage(firstPage);
    } else {
      setSelectedPage(null);
      setCurrentPage(null);
    }
  };

  const handlePageSelect = async (pageId: string) => {
    setSelectedPage(pageId);
    try {
      const response = await fetch(`/api/admin/courses/pages/${pageId}`);
      if (response.ok) {
        const pageData = await response.json();
        setCurrentPage(pageData);

        // Если есть блоки, загружаем их, иначе конвертируем из markdown
        if (pageData.blocks && pageData.blocks.length > 0) {
          setEditorData(prev => ({
            ...prev,
            id: pageData.id,
            title: pageData.title,
            description: pageData.description || '',
            blocks: pageData.blocks,
            status: pageData.isPublished ? 'published' : 'draft'
          }));
        } else {
          // Конвертируем markdown в блоки
          const blocks = parseMarkdownToBlocks(pageData.content || '');
          setEditorData(prev => ({
            ...prev,
            id: pageData.id,
            title: pageData.title,
            description: pageData.description || '',
            blocks: blocks,
            status: pageData.isPublished ? 'published' : 'draft'
          }));
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки страницы:", error);
    }
  };

  // Конвертация Markdown в блоки
  const parseMarkdownToBlocks = (md: string): Block[] => {
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // code fence
      const fence = /^```(\w+)?\s*$/.exec(line);
      if (fence) {
        const lang = fence[1] || 'text';
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        // consume closing ```
        if (i < lines.length && /^```\s*$/.test(lines[i])) i++;
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'code', content: buf.join('\n'), metadata: { language: lang } });
        continue;
      }
      // headings
      if (/^###\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading3', content: line.replace(/^###\s+/, '') });
        i++; continue;
      }
      if (/^##\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading2', content: line.replace(/^##\s+/, '') });
        i++; continue;
      }
      if (/^#\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading1', content: line.replace(/^#\s+/, '') });
        i++; continue;
      }
      // quote
      if (/^>\s?/.test(line)) {
        const buf: string[] = [line.replace(/^>\s?/, '')];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'quote', content: buf.join('\n') });
        continue;
      }
      // unordered list
      const listMatch = /^[-*]\s+(.+)$/.exec(line);
      if (listMatch) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'list', content: listMatch[1] });
        i++;
        while (i < lines.length) {
          const m = /^[-*]\s+(.+)$/.exec(lines[i]);
          if (!m) break; blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'list', content: m[1] }); i++;
        }
        continue;
      }
      // divider
      if (/^---+$/.test(line.trim())) { blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'divider', content: '' }); i++; continue; }
      // empty: объединяем в абзацы по пустой строке
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') { buf.push(lines[i]); i++; }
      if (buf.length) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'paragraph', content: buf.join('\n') });
      } else {
        i++;
      }
    }
    return blocks.length ? blocks : [{ id: `${Date.now()}`, type: 'paragraph', content: '' }];
  };

  const handlePageSave = async () => {
    if (!currentPage) return;

    setSaving(true);
    try {
      // Если используем блочный редактор, сохраняем блоки
      if (useBlockEditor && editorData.blocks) {
        const response = await fetch(`/api/admin/courses/pages/${currentPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...currentPage,
            title: editorData.title,
            content: '', // Очищаем контент, так как используем блоки
            blocks: editorData.blocks,
            isPublished: editorData.status === 'published'
          }),
        });

        if (response.ok) {
          const updatedPage = await response.json();
          setCurrentPage(updatedPage);
          // Обновляем локальное состояние
          setSections(prev => prev.map(section => ({
            ...section,
            pages: section.pages.map(page =>
              page.id === currentPage.id ? updatedPage : page
            )
          })));
        }
      } else {
        // Обычное сохранение markdown
        const response = await fetch(`/api/admin/courses/pages/${currentPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentPage),
        });

        if (response.ok) {
          // Обновляем локальное состояние
          setSections(prev => prev.map(section => ({
            ...section,
            pages: section.pages.map(page =>
              page.id === currentPage.id ? currentPage : page
            )
          })));
        }
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    } finally {
      setSaving(false);
    }
  };

  // Сохранение данных блочного редактора
  const handleBlockEditorSave = async (data: CourseEditorData) => {
    if (!currentPage) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/courses/pages/${currentPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentPage,
          title: data.title,
          content: '', // Очищаем контент, так как используем блоки
          blocks: data.blocks,
          isPublished: data.status === 'published'
        }),
      });

      if (response.ok) {
        const updatedPage = await response.json();
        setCurrentPage(updatedPage);
        setEditorData(prev => ({
          ...prev,
          id: updatedPage.id,
          title: updatedPage.title,
          status: updatedPage.isPublished ? 'published' : 'draft'
        }));

        // Обновляем локальное состояние
        setSections(prev => prev.map(section => ({
          ...section,
          pages: section.pages.map(page =>
            page.id === currentPage.id ? updatedPage : page
          )
        })));
      }
    } catch (error) {
      console.error("Ошибка сохранения блочного редактора:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/admin/courses/${params.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSectionTitle,
          description: "",
          order: sections.length,
        }),
      });

      if (response.ok) {
        const newSection = await response.json();
        setSections(prev => [...prev, newSection]);
        setNewSectionTitle("");
        setShowNewSection(false);
      }
    } catch (error) {
      console.error("Ошибка создания раздела:", error);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !selectedSection) return;
    
    try {
      const response = await fetch(`/api/admin/courses/sections/${selectedSection}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageTitle,
          content: "# " + newPageTitle + "\n\nНачните писать контент здесь...",
          order: sections.find(s => s.id === selectedSection)?.pages.length || 0,
        }),
      });

      if (response.ok) {
        const newPage = await response.json();
        setSections(prev => prev.map(section => 
          section.id === selectedSection 
            ? { ...section, pages: [...section.pages, newPage] }
            : section
        ));
        setNewPageTitle("");
        setShowNewPage(false);
        
        // Выбираем новую страницу
        setSelectedPage(newPage.id);
        setCurrentPage(newPage);
      }
    } catch (error) {
      console.error("Ошибка создания страницы:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Ошибка загрузки</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Левая панель - навигация по разделам и страницам */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Заголовок курса */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {course?.title}
            </h2>
            <Link
              href={`/admin/courses/${params.id}`}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Настройки
            </Link>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Редактор контента
          </p>
        </div>

        {/* Навигация по разделам */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.id} className="border-b border-gray-100 dark:border-gray-700">
              {/* Заголовок раздела */}
              <div 
                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedSection === section.id ? 'bg-gray-50 dark:bg-gray-900/30' : ''
                }`}
                onClick={() => handleSectionSelect(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      section.isPublished 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {section.isPublished ? 'Опубликован' : 'Черновик'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Страницы раздела */}
              {selectedSection === section.id && (
                <div className="pl-6">
                  {section.pages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedPage === page.id ? 'bg-gray-100 dark:bg-gray-900/50' : ''
                      }`}
                      onClick={() => handlePageSelect(page.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{page.title}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          page.isPublished 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {page.isPublished ? 'Опубликована' : 'Черновик'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Кнопка добавления страницы */}
                  <button
                    onClick={() => setShowNewPage(true)}
                    className="w-full p-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded transition-colors"
                  >
                    + Добавить страницу
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {/* Кнопка добавления раздела */}
          <button
            onClick={() => setShowNewSection(true)}
            className="w-full p-3 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
          >
            + Добавить раздел
          </button>
        </div>
      </div>

      {/* Правая панель - редактор контента */}
      <div className="flex-1 flex flex-col">
        {currentPage ? (
          <>
            {/* Заголовок страницы */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPage.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {sections.find(s => s.id === selectedSection)?.title} • Страница
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Переключатель режима редактора */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setUseBlockEditor(false)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        !useBlockEditor
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => setUseBlockEditor(true)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        useBlockEditor
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      Blocks
                    </button>
                  </div>

                  <span className={`px-3 py-1 text-sm rounded-full ${
                    currentPage.isPublished
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {currentPage.isPublished ? 'Опубликована' : 'Черновик'}
                  </span>
                  <button
                    onClick={handlePageSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Сохранить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Редактор контента */}
            <div className="flex-1">
              {useBlockEditor ? (
                // Блочный редактор
                <ModernArticleEditor
                  initialData={{
                    id: editorData.id,
                    title: editorData.title,
                    description: editorData.description,
                    blocks: editorData.blocks,
                    category: editorData.category,
                    tags: editorData.tags,
                    status: editorData.status
                  }}
                  onSave={handleBlockEditorSave}
                  isNew={false}
                />
              ) : (
                // Обычный Markdown редактор
                <div className="p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Заголовок страницы
                      </label>
                      <input
                        type="text"
                        value={currentPage.title}
                        onChange={(e) => setCurrentPage(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Контент (Markdown)
                      </label>
                      <textarea
                        value={currentPage.content}
                        onChange={(e) => setCurrentPage(prev => prev ? { ...prev, content: e.target.value } : null)}
                        rows={20}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono text-sm resize-none"
                        placeholder="Начните писать контент здесь... Поддерживается Markdown разметка."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Выберите страницу для редактирования
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Создайте разделы и страницы в левой панели, чтобы начать работу
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Модальные окна для создания новых элементов */}
      
      {/* Создание раздела */}
      {showNewSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Создать новый раздел
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название раздела
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Введите название раздела"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewSection(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateSection}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Создание страницы */}
      {showNewPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Создать новую страницу
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название страницы
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Введите название страницы"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewPage(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreatePage}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
