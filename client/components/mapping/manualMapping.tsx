import { GMDMapState, useGMDMappingStore } from "@/lib/stores/mappingStore";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { ArrowRightLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import Droppable from "../manualMapping/dropable";
import Draggable from "../manualMapping/draggable";
import { findIndexOfValue, getKeyFromValue } from "@/lib/utils";
import { getMetadata } from "@/lib/constants/gmdDict";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function ManualMapping({ gmState }: { gmState: GMDMapState }) {
  const [gmdColumns, setGmdColumns] = useState<string[]>([]);
  const [mappedColumns, setMappedColumns] = useState<
    Map<string, string | null>
  >(new Map<string, string | null>());
  const [unMappedColumns, setUnMappedColumns] = useState<
    Map<string, string | null>
  >(new Map<string, string | null>());

  const [requiredColumns, setRequiredColumns] = useState<
    Map<string, string | null>
  >(new Map<string, string | null>());

  const [activeId, setActiveId] = useState<string | null>();

  const { editMapping } = useGMDMappingStore();

  function onSave() {
    const combinedMapped: { [key: string]: string } = {};
    const req: { [key: string]: string } = {};

    const combinedUnmapped: string[] = [];

    mappedColumns.forEach((value, key) => {
      if (value !== null) {
        combinedMapped[key.split("-")[0]] = value.split("-")[0];
      } else {
        combinedUnmapped.push(key.split("-")[0]);
      }
    });
    unMappedColumns.forEach((value, key) => {
      if (value !== null) {
        combinedMapped[key.split("-")[0]] = value.split("-")[0];
      } else {
        combinedUnmapped.push(key.split("-")[0]);
      }
    });

    requiredColumns.forEach((value, key) => {
      if (
        findIndexOfValue(
          new Map<string, string>(Object.entries(combinedMapped)),
          key
        ) === -1
      ) {
        if (value !== null) {
          req[key] = value;
        } else {
          req[key] = "";
        }
      }
    });

    editMapping({
      ...gmState,
      isMappingCorrect: true,
      mappedColumns: combinedMapped,
      unMappedColumns: combinedUnmapped,
      requiredColumns: req,
    });
  }
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function findContainer(id: string) {
    if (id == "columns") return "unmappedHeaders";

    if (mappedColumns.get(id) !== undefined) {
      return "mappedColumns";
    }
    if (unMappedColumns.get(id) !== undefined) {
      return "unmappedColumns";
    }
    if (gmdColumns.includes(id)) {
      return "unmappedHeaders";
    }
    if (getKeyFromValue(mappedColumns, id) !== undefined) {
      return "mappedColumns";
    }
    if (getKeyFromValue(unMappedColumns, id) !== undefined) {
      return "unmappedColumns";
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const id = active.id as string;
    const overId = over.id as string;

    const to = findContainer(overId);
    const from = findContainer(id);

    if (from == "mappedColumns" && to == "unmappedColumns") {
      const key = getKeyFromValue(mappedColumns, id);
      if (key) {
        if (getKeyFromValue(unMappedColumns, overId) !== undefined) {
          const map1 = new Map(mappedColumns);
          const map2 = new Map(unMappedColumns);
          map1.set(key, overId);
          map2.set(getKeyFromValue(unMappedColumns, overId)!, id);
          setUnMappedColumns((prev) => map2);
          setMappedColumns((prev) => map1);
        } else {
          setMappedColumns((prev) => prev.set(key, null));
          setUnMappedColumns((prev) => prev.set(overId, id));
        }
      }
    } else if (from == "unmappedColumns" && to == "mappedColumns") {
      const key = getKeyFromValue(unMappedColumns, id);
      if (key) {
        if (getKeyFromValue(mappedColumns, overId) !== undefined) {
          const map1 = new Map(mappedColumns);
          const map2 = new Map(unMappedColumns);
          map2.set(key, overId);
          map1.set(getKeyFromValue(mappedColumns, overId)!, id);
          setMappedColumns((prev) => map1);
          setUnMappedColumns((prev) => map2);
        } else {
          setMappedColumns((prev) => prev.set(overId, id));
          setUnMappedColumns((prev) => prev.set(key, null));
        }
      }
    } else if (from == "mappedColumns" && to == "mappedColumns") {
      const key = getKeyFromValue(mappedColumns, overId);
      if (key === undefined) {
        const map = new Map(mappedColumns);

        map.set(getKeyFromValue(map, id)!, null);
        map.set(overId, id);
        setMappedColumns((prev) => map);
      } else {
        const map = new Map(mappedColumns);
        map.set(getKeyFromValue(map, id)!, overId);
        map.set(key, id);

        setMappedColumns((prev) => map);
      }
    } else if (from == "unmappedColumns" && to == "unmappedColumns") {
      const key = getKeyFromValue(unMappedColumns, overId);
      if (key === undefined) {
        const map = new Map(unMappedColumns);
        map.set(getKeyFromValue(map, id)!, null);
        map.set(overId, id);
        setUnMappedColumns((prev) => map);
      } else {
        const map = new Map(unMappedColumns);
        map.set(getKeyFromValue(map, id)!, overId);
        map.set(key, id);
        setUnMappedColumns((prev) => map);
      }
    } else if (from == "unmappedHeaders" && to == "mappedColumns") {
      const key = getKeyFromValue(mappedColumns, overId);
      if (key) {
        const map = new Map(mappedColumns);
        map.set(key, id);
        setMappedColumns((prev) => map);
        setGmdColumns((prev) => [...prev.filter((col) => col !== id), overId]);
      } else {
        setMappedColumns((prev) => prev.set(overId, id));
        setGmdColumns((prev) => [...prev.filter((col) => col !== id)]);
      }
    } else if (from == "unmappedHeaders" && to == "unmappedColumns") {
      const key = getKeyFromValue(unMappedColumns, overId);
      if (key) {
        const map = new Map(unMappedColumns);
        map.set(key, id);
        setUnMappedColumns((prev) => map);
        setGmdColumns((prev) => [...prev.filter((col) => col !== id), overId]);
      } else {
        setUnMappedColumns((prev) => prev.set(overId, id));
        setGmdColumns((prev) => [...prev.filter((col) => col !== id)]);
      }
    } else if (from == "mappedColumns" && to == "unmappedHeaders") {
      const key = getKeyFromValue(mappedColumns, id);
      if (key) {
        const map = new Map(mappedColumns);
        map.set(key, null);
        setMappedColumns((prev) => map);
        setGmdColumns((prev) => [id, ...prev]);
      }
    } else if (from == "unmappedColumns" && to == "unmappedHeaders") {
      const key = getKeyFromValue(unMappedColumns, id);
      if (key) {
        const map = new Map(unMappedColumns);
        map.set(key, null);
        setUnMappedColumns((prev) => map);
        setGmdColumns((prev) => [id, ...prev]);
      }
    }

    setActiveId(null);
  }

  useEffect(() => {
    reset();
  }, [gmState]);

  function reset() {
    setGmdColumns(gmState.unMappedHeaders.map((col) => col + "-GMDHeaders"));
    const tempMap: Map<string, string | null> = new Map();
    Object.keys(gmState.mappedColumns).forEach((key) => {
      tempMap.set(
        key + "-UserColumns",
        gmState.mappedColumns[key] + "-GMDHeaders"
      );
    });
    setMappedColumns(tempMap);
    const tempMap2: Map<string, string | null> = new Map();
    gmState.unMappedColumns.forEach((key) => {
      tempMap2.set(key + "-UserColumns", null);
    });
    setUnMappedColumns(tempMap2);

    const temp3: Map<string, string | null> = new Map();
    Object.keys(gmState.requiredColumns).forEach((key) => {
      temp3.set(key, null);
    });
    setRequiredColumns(temp3);
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full m-3 p-3 flex flex-row gap-4">
        <div className="flex flex-col flex-1 gap-6">
          <div className="flex flex-col p-6 justify-start items-center gap-2 shadow-md rounded-md ">
            <h1 className="text-xl font-bold ">Mapped Columns</h1>
            <p className="text-sm text-gray-600 mb-4 mt-1 ">
              List of columns which are mapped
            </p>
            <table className="w-full text-center">
              <tbody>
                {Array.from(mappedColumns.entries()).map(([key, value]) => (
                  <tr key={key}>
                    <TooltipProvider>
                      <Tooltip>
                        <td className="border-b p-3 w-12">
                          {value &&
                          getMetadata(value.split("-")[0])?.dataType !==
                            gmState.columnTypes[key.split("-")[0]] ? (
                            <>
                              <TooltipContent>
                                <p>Data Type Mis-Match</p>
                              </TooltipContent>
                              <TooltipTrigger asChild>
                                <TriangleAlert className="text-red-200" />
                              </TooltipTrigger>
                            </>
                          ) : null}
                        </td>
                      </Tooltip>
                    </TooltipProvider>

                    <td className="border-b p-3 w-1/2">
                      <p className="p-3 text-center border-2 border-black rounded-md">
                        {key.split("-")[0]}
                      </p>
                    </td>

                    <td className="border-b p-3 w-12">
                      <ArrowRightLeft color="lightgray" className="mx-auto" />
                    </td>

                    <td className="border-b p-3 w-1/2">
                      {value === null ? (
                        <Droppable
                          className="p-3 text-center border-2 border-dashed rounded-md"
                          id={key}
                        >
                          <p>Empty</p>
                        </Droppable>
                      ) : (
                        <Droppable id={value} className="w-full">
                          <Draggable
                            className="p-3 w-full text-center border-2 border-black rounded-md"
                            id={value}
                          >
                            <p>{value.split("-")[0]}</p>
                          </Draggable>
                        </Droppable>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col p-6 justify-start items-center gap-2 shadow-md rounded-md">
            <h1 className="text-xl font-bold ">Un-Mapped Columns</h1>
            <p className="text-sm text-gray-600 mb-4 mt-1 ">
              List of columns which are not mapped
            </p>
            <table className="w-full text-center">
              <tbody>
                {Array.from(unMappedColumns.entries()).map(([key, value]) => (
                  <tr key={key}>
                    {/* Minimal width for the triangle icon with tooltip */}
                    <td className="border-b p-3 w-12">
                      <TooltipProvider>
                        <Tooltip>
                          {value &&
                          getMetadata(value.split("-")[0])?.dataType !==
                            gmState.columnTypes[key.split("-")[0]] ? (
                            <>
                              <TooltipContent>
                                <p>Data Type Mis-Match</p>
                              </TooltipContent>
                              <TooltipTrigger asChild>
                                <TriangleAlert className="text-red-200" />
                              </TooltipTrigger>
                            </>
                          ) : null}
                        </Tooltip>
                      </TooltipProvider>
                    </td>

                    {/* Equal width for the unmapped column key */}
                    <td className="border-b p-3 w-1/2">
                      <p className="p-3 text-center border-2 border-black rounded-md">
                        {key.split("-")[0]}
                      </p>
                    </td>

                    {/* Minimal width for the arrow icon */}
                    <td className="border-b p-3 w-12">
                      <ArrowRightLeft color="lightgray" className="mx-auto" />
                    </td>

                    {/* Equal width for the unmapped column value */}
                    <td className="border-b p-3 w-1/2">
                      {value === null ? (
                        <Droppable
                          className="p-3 text-center border-2 border-dashed rounded-md"
                          id={key}
                        >
                          <p>Empty</p>
                        </Droppable>
                      ) : (
                        <Droppable id={value} className="w-full">
                          <Draggable
                            className="p-3 w-full text-center border-2 border-black rounded-md"
                            id={value}
                          >
                            <p>{value.split("-")[0]}</p>
                          </Draggable>
                        </Droppable>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requiredColumns.size > 0 ? (
            <div className="flex flex-col p-6 justify-start items-center gap-2 shadow-md rounded-md">
              <h1 className="text-xl font-bold ">Useful Metrics</h1>
              <p className="text-sm text-gray-600 mb-4 mt-1 ">
                List of columns which are not mapped
              </p>
              <table className="w-full text-center">
                <tbody>
                  {Array.from(requiredColumns.entries()).map(([key, value]) => (
                    <tr key={key}>
                      {/* Equal width for the unmapped column key */}
                      <td className="border-b p-3 w-1/2">
                        <p className="p-3 text-center border-2 border-black rounded-md">
                          {key}
                        </p>
                      </td>

                      <td className="border-b p-3 w-12">
                        <ChevronRight color="lightgray" className="mx-auto" />
                      </td>

                      <td className="border-b p-3 w-1/2">
                        <Input
                          type="text"
                          placeholder="value"
                          value={value ?? ""}
                          onChange={(e) => {
                            const newMap = new Map(requiredColumns);
                            newMap.set(key, e.target.value);
                            setRequiredColumns(newMap);
                          }}
                        ></Input>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <></>
          )}
        </div>
        <div className="flex-1">
          <Droppable
            id="columns"
            className="flex flex-col p-8 justify-start items-center shadow-md rounded-md max-h-[120vh] overflow-y-scroll"
          >
            <h1 className="text-xl font-bold  ">Global Metric Dict</h1>
            <p className="text-sm text-gray-600 mb-6  mt-1">
              Global Metric Dictionary Columns
            </p>
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="border-b-2  border-black p-2">Column</th>
                  <th className="border-b-2 border-black p-2">Data Type</th>
                  <th className="border-b-2 border-black p-2">Description</th>
                </tr>
              </thead>
              <tbody className="">
                {gmdColumns.map((column) => (
                  <tr key={column}>
                    <td className="border-b p-3">
                      <Draggable id={column} className="w-full text-center">
                        <p className="border-2 border-black rounded-md p-3">
                          {column.split("-")[0]}
                        </p>
                      </Draggable>
                    </td>

                    <td className="border-b p-3">
                      {getMetadata(column.split("-")[0])?.dataType ?? "N/A"}
                    </td>
                    <td
                      title={getMetadata(column.split("-")[0])?.description}
                      className="border-b p-3 truncate max-w-44"
                    >
                      {getMetadata(column.split("-")[0])?.description ?? "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Droppable>
        </div>
      </div>
      <div className="flex flex-col items-center  gap-4">
        <h1 className="text-2xl font-bold">Save the mapping</h1>
        <div className="flex flex-row items-center justify-between gap-6">
          <Button variant={"outline"} onClick={() => reset()}>
            Reset
          </Button>

          <Button onClick={onSave}>Save/Next</Button>
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
