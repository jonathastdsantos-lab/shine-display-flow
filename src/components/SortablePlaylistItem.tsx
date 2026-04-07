import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";

interface SortablePlaylistItemProps {
  id: string;
  index: number;
  name: string;
  onRemove: () => void;
}

export default function SortablePlaylistItem({ id, name, onRemove }: SortablePlaylistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary/30 opacity-90 scale-[1.02]" : ""
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="flex-1 truncate">{name}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
