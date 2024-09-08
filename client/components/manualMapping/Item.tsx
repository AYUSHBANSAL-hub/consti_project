import React from "react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
interface ItemProps {
  id: string;
  isDragging: boolean;
  isOver: boolean;
}

export function Item({ id, isDragging, isOver }: ItemProps) {
  return (
    <div
      className={`w-full h-12 flex items-center justify-center border ${
        isOver ? "border-red-400" : "border-gray-400"
      } ${isDragging ? "bg-red-400" : "bg-white"} rounded-md mb-2`}
    >
      {id}
    </div>
  );
}

interface SortableItemProps {
  id: string;
}

export default function SortableItem({ id }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
      }}
      {...attributes}
      {...listeners}
    >
      <Item isDragging={isDragging} isOver={false} id={id} />
    </div>
  );
}
