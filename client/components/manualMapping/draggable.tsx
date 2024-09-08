import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export default function Draggable({
  children,
  id,
  className,
  isDraggable = false,
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
  isDraggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
    });

  return (
    <button
      ref={setNodeRef}
      style={{
        transform:
          transform && isDraggable
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
      }}
      {...listeners}
      {...attributes}
      className={cn(isDragging ? "opacity-50 animate-bounce" : "", className)}
    >
      {children}
    </button>
  );
}
