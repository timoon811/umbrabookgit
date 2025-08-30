import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentationSection } from '@/types/documentation';

interface SortableSectionProps {
  section: DocumentationSection;
  children: React.ReactNode;
}

export default function SortableSection({ section, children }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

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
          // ДЕБАГ: Логируем нажатие пробела в SortableSection
          if (e.key === ' ') {
            console.log('🔍 SortableSection SPACEBAR (NO LISTENERS):', {
              key: e.key,
              target: (e.target as HTMLElement).tagName,
              currentTarget: (e.currentTarget as HTMLElement).tagName,
              sectionId: section.id
            });
          }
        }}
        className="relative group"
        data-sortable-handle="true"
      >
        {children}
      </div>
    </div>
  );
}
