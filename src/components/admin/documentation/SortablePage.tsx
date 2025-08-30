import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentationPage } from '@/types/documentation';

interface SortablePageProps {
  page: DocumentationPage;
  onClick: () => void;
  children: React.ReactNode;
}

export default function SortablePage({ page, onClick, children }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `page-${page.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="select-none"
    >
      {/* ВРЕМЕННО УБИРАЕМ LISTENERS ДЛЯ ТЕСТИРОВАНИЯ */}
      <div 
        onKeyDown={(e) => {
          // ДЕБАГ: Логируем нажатие пробела в SortablePage
          if (e.key === ' ') {
            console.log('🔍 SortablePage SPACEBAR (NO LISTENERS):', {
              key: e.key,
              target: (e.target as HTMLElement).tagName,
              currentTarget: (e.currentTarget as HTMLElement).tagName,
              pageId: page.id
            });
          }
        }}
        onClick={(e) => {
          // Проверяем, что клик не по полю ввода
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.closest('input')) {
            return;
          }
          if (!isDragging) {
            onClick();
          }
        }}
        className="cursor-pointer"
        data-sortable-handle="true"
      >
        {children}
      </div>
    </div>
  );
}
