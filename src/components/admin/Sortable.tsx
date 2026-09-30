"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

type SortableProps = {
  /** Ids in the order they are currently rendered. */
  ids: string[];
  onReorder: (ids: string[]) => void;
  strategy?: SortingStrategy;
  className?: string;
  children: React.ReactNode;
};

export function Sortable({
  ids,
  onReorder,
  strategy = verticalListSortingStrategy,
  className,
  children,
}: SortableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={strategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && "z-20 opacity-80")}
    >
      {children}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Seret untuk mengubah urutan"
        className="absolute right-2 top-2 cursor-grab border border-line bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ash active:cursor-grabbing"
      >
        Seret
      </button>
    </div>
  );
}
