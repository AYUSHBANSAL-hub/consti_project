import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import SortableItem from "./Item";
import Droppable from "./dropable";

const containerStyle =
  "bg-gray-200 p-4 m-2 flex-1 border border-gray-400 rounded-lg";

export default function Container({
  id,
  items,
}: {
  id: string;
  items: string[];
}) {
  // const { setNodeRef } = useDroppable({ id });

  return (
    <div className={containerStyle}>
      {items.map((itemId) => (
        <Droppable key={itemId} id={itemId}>
          <SortableItem key={itemId} id={itemId} />
        </Droppable>
      ))}
    </div>
  );
}
