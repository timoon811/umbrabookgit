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
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          onClick();
        }
      }}
      className="select-none cursor-pointer"
    >
      {children}
    </div>
  );
}
