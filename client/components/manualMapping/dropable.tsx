import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export default function Droppable(props: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });

  return (
    <div
      className={cn(isOver ? "bg-primary/10" : "", props.className)}
      ref={setNodeRef}
    >
      {props.children}
    </div>
  );
}
