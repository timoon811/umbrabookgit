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
      {/* Создаем обертку для drag handle, чтобы не блокировать поля ввода */}
      <div 
        {...listeners}
        className="relative group"
        data-sortable-handle="true"
      >
        {children}
      </div>
    </div>
  );
}
