"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { GMDMapState, useGMDMappingStore } from "@/lib/stores/mappingStore";

import {
  findIndexOfKey,
  findIndexOfValue,
  getKeyFromValue,
  swapInMap,
} from "@/lib/utils";
import Droppable from "@/components/manualMapping/dropable";
import Draggable from "@/components/manualMapping/draggable";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function App() {
  const [mappings, setMapping] = useState<Map<string, string | null>>(
    new Map<string, string | null>()
  );
  const router = useRouter();
  const { mapping, editMapping } = useGMDMappingStore();
  const [columns, setColumns] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>();
  const searchParams = useSearchParams();
  const id = searchParams.get("id")
    ? decodeURIComponent(searchParams.get("id")!)
    : "";
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function findContainer(id: string) {
    const value = mappings.get(id);
    if (value !== undefined) return "mapped";
    const val2 = findIndexOfValue(mappings, id);
    if (val2 !== -1) return "mapped";
    return "unmapped";
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const id = active.id as string;
    const overId = over.id as string;

    const to = findContainer(overId);
    const from = findContainer(id);

    if (to == "mapped" && from == "unmapped") {
      if (mappings.get(overId) !== undefined) {
        setMapping((prev) => prev.set(overId, id));
        setColumns((prev) => prev.filter((col) => col !== id));
      } else {
        const key = getKeyFromValue(mappings, overId);
        if (key) {
          setMapping((prev) => prev.set(key, id));
          setColumns((prev) => [...prev.filter((col) => col !== id), overId]);
        }
      }
    } else if (to == "unmapped" && from == "mapped") {
      const key = getKeyFromValue(mappings, id);
      if (key) {
        setMapping((prev) => prev.set(key, null));
        setColumns((prev) => [...prev, id]);
      }
    } else if (to == "mapped" && from == "mapped") {
      const key1 = findIndexOfValue(mappings, id);
      const key2 = findIndexOfValue(mappings, overId);
      if (key1 > -1 && key2 > -1) {
        setMapping((prev) => swapInMap(prev, key1, key2));
      } else if (key1 > -1 && !(key2 > -1)) {
        const key2 = findIndexOfKey(mappings, overId);
        if (key2 > -1) {
          setMapping((prev) => swapInMap(prev, key1, key2));
        }
      }
    }

    setActiveId(null);
  }

  useEffect(() => {
    if (!id) return;
    const mapp = mapping.findIndex((map) => map.fileName === id);
    if (mapp === -1) return;

    const d = mapping[mapp];
    const tempMap: Map<string, string | null> = new Map();
    Object.keys(d.mappedColumns).forEach((key) => {
      tempMap.set(key + "-" + "header", d.mappedColumns[key] + "-noHeader");
    });
    d.unmappedHeaders.forEach((key) => {
      tempMap.set(key + "-" + "header", null);
    });
    setMapping((prev) => new Map(tempMap));
    setColumns(d.unmappedColumns.map((col) => col + "-noHeader"));
  }, []);

  function save() {
    const mapp = mapping.findIndex((map) => map.fileName === id);
    if (mapp === -1) return;
    const state: GMDMapState = {
      ...mapping[mapp],
      isMappingCorrect: true,
    };
    const mappedColumns: { [key: string]: string } = {};
    const unmappedHeaders: string[] = [];
    mappings.forEach((value, key) => {
      if (value !== null) {
        mappedColumns[key.split("-")[0]] = value.split("-")[0];
      } else {
        unmappedHeaders.push(key.split("-")[0]);
      }
    });
    const unmappedColumns = columns.map((col) => col.split("-")[0]);

    state.mappedColumns = mappedColumns;
    state.unmappedHeaders = unmappedHeaders;
    state.unmappedColumns = unmappedColumns;
    editMapping(state);
    router.back();
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col p-8 m-4 border-2 rounded-md">
        <h1 className="text-2xl font-bold self-start mb-8">{id}</h1>
        <div className="flex flex-row items-start gap-4 justify-around">
          <div className="flex flex-col shadow-md rounded-lg p-8 justify-start items-center">
            <h1 className="text-xl font-bold self-start ">Mapped Columns</h1>
            <p className="text-sm text-gray-600 mb-6 mt-1 self-start">
              List of columns which are mapped with
            </p>
            {Array.from(mappings.entries()).map(([key, value]) => (
              <div className="flex flex-row items-center justify-start">
                <p className="p-3 w-52 text-center border-2 border-black rounded-md m-3">
                  {key.split("-")[0]}
                </p>
                <ArrowRightLeft color="lightgray" />
                {value === null ? (
                  <Droppable
                    className="p-3 w-52 text-center border-2 border-dashed  rounded-md m-3"
                    id={key}
                  >
                    <p>Empty</p>
                  </Droppable>
                ) : (
                  <Droppable id={value} className=" w-52 flex m-3">
                    <Draggable
                      className="flex-1 p-3 text-center border-2 border-black rounded-md "
                      id={value}
                    >
                      <p>{value.split("-")[0]}</p>
                    </Draggable>
                  </Droppable>
                )}
              </div>
            ))}
          </div>
          <Droppable
            id="columns"
            className="flex flex-col shadow-md rounded-lg p-8 justify-start items-center sticky top-4"
          >
            <h1 className="text-xl font-bold self-start ">Unmapped Columns</h1>
            <p className="text-sm text-gray-600 mb-6 self-start mt-1">
              List of columns which are not mapped
            </p>
            {columns.map((column) => (
              <Draggable
                id={column}
                className="flex w-52 text-center flex-row items-center justify-start mb-6 "
              >
                <p className="p-3 flex-1 border-2 border-black rounded-md ">
                  {column.split("-")[0]}
                </p>
              </Draggable>
            ))}
          </Droppable>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Save the mapping</h1>
        <div className="flex flex-row items-center justify-between gap-6">
          <Button onClick={save}>Save</Button>
        </div>
        <p>If not you can drag and drop mapping</p>
      </div>

      <DragOverlay>
        {activeId ? (
          <Draggable
            id={activeId}
            isDraggable={true}
            className="flex flex-row w-52 text-center items-center justify-start"
          >
            <p className="p-3 flex-1 border-2 border-black rounded-md m-3">
              {activeId.split("-")[0]}
            </p>
          </Draggable>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
