import { Result } from "@/app/search/page";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { ChevronDown, X } from "lucide-react";
import { useRef, useState, RefObject } from "react";
import SortableTable from "./sortableTable";
import ChartSection from "./chartSection";
import { getMetadata } from "@/lib/constants/gmdDict";
import { Spinner } from "../ui/loader";
import { Skeleton } from "../ui/skeleton";
import { Table as ResultTable } from "@/app/search/page";

interface Table {
  headers: string[];
  rows: any[];
  data: Record<string, Record<string, any>>; // This makes `data` compatible with `Result`
}

interface Chat extends Result {
  table: Table; // Updated to include 'data'
  columns: string[];
  chart?: any;
  suggestions?: string[];
}
interface FilterViewProps {
  columns: string[];
  columnValues: { [key: string]: string[] };
  selectedColumns: string[];
  setSelectedColumns: (columns: string[]) => void;
  selectedColumnValues: { [key: string]: string[] };
  setSelectedColumnValues: (values: { [key: string]: string[] }) => void;
}

function FilterView({
  columns,
  columnValues,
  selectedColumns,
  setSelectedColumns,
  selectedColumnValues,
  setSelectedColumnValues,
}: {
  columns: string[];
  columnValues: { [key: string]: string[] };
  selectedColumns: string[];
  setSelectedColumns: (columns: string[]) => void;
  selectedColumnValues: { [key: string]: string[] };
  setSelectedColumnValues: (values: { [key: string]: string[] }) => void;
}) {
  return (
    <div className="filter-view space-y-4 mb-4 p-4 shadow-md rounded-md">
      <h3 className="text-lg font-bold">Filter View</h3>
      <div className="columns-filter">
        <p className="font-semibold mb-2">Select Columns:</p>
        {columns.map((column) => (
          <label key={column} className="block">
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedColumns.includes(column)}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setSelectedColumns((prev: string[]) => {
                  return isChecked ? [...prev, column] : prev.filter((col) => col !== column);
                });
              }}
              
            />
            {column}
          </label>
        ))}
      </div>

      {selectedColumns.map((column) => (
        <div key={column} className="column-values-filter">
          <p className="font-semibold mb-2">Select values for {column}:</p>
          {columnValues[column]?.map((value) => (
            <label key={value} className="block">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedColumnValues[column]?.includes(value) || false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setSelectedColumnValues((prev: { [key: string]: string[] }) => {
                    const updatedValues: { [key: string]: string[] } = {
                      ...prev,
                    };
                
                    // Initialize the column if it doesn't exist
                    if (!updatedValues[column]) {
                      updatedValues[column] = [];
                    }
                
                    // Update based on checkbox state
                    if (isChecked) {
                      updatedValues[column] = [...updatedValues[column], value];
                    } else {
                      updatedValues[column] = updatedValues[column].filter((val: string) => val !== value);
                    }
                
                    return updatedValues;
                  });
                }}
                
              />
              {value}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Chat({
  chat,
  index,
  onColumnClick,
  onChartUpdate,
}: {
  chat: Chat;
  index: number;
  onChartUpdate: (
    groupBy: string,
    breakdown: string,
    metric: string,
    index: number,
    ref: RefObject<HTMLDivElement>
  ) => void;
  onColumnClick: (
    column: string,
    remove: boolean,
    index: number,
    ref: RefObject<HTMLDivElement>
  ) => void;
}) {
  const [collapsible, setCollapsible] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedColumnValues, setSelectedColumnValues] = useState<{ [key: string]: string[] }>({});


  const activeColumns = chat.columns.filter((column) =>
    chat.table.headers.includes(column)
  );

  const DimensionList = activeColumns.filter((column) => {
    const metaData = getMetadata(column);
    if (!metaData) {
      return true;
    }
    return metaData.dataType != "number";
  });

  const MetricList = activeColumns.filter(
    (column) => !DimensionList.includes(column)
  );

  const getColumnValues = (chatData: Chat) => {
    const columnValues: { [key: string]: string[] } = {};

    chatData.table.rows.forEach((row: any[]) => {
      chatData.table.headers.forEach((header: string, index: number) => {
        if (!columnValues[header]) {
          columnValues[header] = [];
        }
        const value = row[index];
        if (!columnValues[header].includes(value)) {
          columnValues[header].push(value);
        }
      });
    });

    return columnValues;
  };

  const columnValues = getColumnValues(chat);

  // Filtered table based on selected columns and values
  const filteredTable = {
    headers: chat.table.headers.filter((header) =>
      selectedColumns.includes(header)
    ),
    rows: chat.table.rows.filter((row) => {
      return selectedColumns.every((column) => {
        const columnIndex = chat.table.headers.indexOf(column);
        const cellValue = row[columnIndex];
        return (
          selectedColumnValues[column]?.length === 0 ||
          selectedColumnValues[column].includes(cellValue)
        );
      });
    }),
    data: chat.table.data, // Include data here as required by the `Table` interface
  };

  return chat.loading && chat?.title == "" ? (
    <div ref={chatRef} className="flex flex-row justify-start">
      <div className="space-y-4 shadow-md p-3 rounded-md">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-6 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ) : (
    <div className="flex relative flex-col justify-start">
      {chat.loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
          <Spinner size={"large"} />
        </div>
      )}
      <div
        ref={chatRef}
        key={chat.userInput + index}
        className="space-y-5 shadow-md mr-20 mt-5 p-4 rounded-md flex-col"
      >
        <div className="flex flex-row justify-between items-center">
          <div className="flex justify-between items-start flex-col ">
            <p className="text-sm text-gray-500">Question/Query</p>
            <h1 className="text-lg font-bold">{chat.userInput}</h1>
          </div>
          <button
            className="transition-transform duration-300"
            onClick={() => setCollapsible(!collapsible)}
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                collapsible ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </div>

        {collapsible && (
          <div className="space-y-5 rounded-md flex-col">
            <Separator orientation="horizontal" />
            {/* Filter View */}
            <FilterView
              columns={chat.table.headers}
              columnValues={columnValues}
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
              selectedColumnValues={selectedColumnValues}
              setSelectedColumnValues={setSelectedColumnValues}
            />

            <SortableTable table={filteredTable} />
            {chat.chart && (
              <ChartSection
                chat={chat}
                DimensionList={DimensionList}
                MetricList={MetricList}
                index={index}
                onClick={(...args) => onChartUpdate(...args, index, chatRef)}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-row mt-3 gap-2">
        {chat.suggestions?.map((suggestion, ind) => (
          <Badge
            key={`suggestion-${ind}`}
            title={suggestion}
            className="cursor-pointer"
            variant={"secondary"}
          >
            {suggestion}
          </Badge>
        ))}
      </div>
    </div>
  );
}
