import { Table as TableType } from "@/app/search/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMemo, useState } from "react";

export default function SortableTable({ table }: { table: TableType }) {
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<"Ascending" | "Descending">("Ascending");

  const sortedData = useMemo(() => {
    if (!sortBy) return table.data;

    const sortedKeys = Object.keys(table.data[sortBy]).sort((a, b) => {
      const valueA = table.data[sortBy][a];
      const valueB = table.data[sortBy][b];

      if (valueA < valueB) return order === "Ascending" ? -1 : 1;
      if (valueA > valueB) return order === "Ascending" ? 1 : -1;
      return 0;
    });

    const newSortedData: Record<string, Record<string, any>> = {};
    table.headers.forEach((header) => {
      newSortedData[header] = {};
      sortedKeys.forEach((key, index) => {
        newSortedData[header][index] = table.data[header][key];
      });
    });

    return newSortedData;
  }, [sortBy, order, table.data, table.headers]);

  return (
    <div className="flex justify-between items-start flex-col ">
      <div className="self-stretch flex flex-row justify-between  p-3">
        <p className="text-sm text-gray-500 mb-2">Table</p>
        <div className=" flex flex-row gap-5">
          <Select
            onValueChange={(value) =>
              setSortBy(value == "None" ? undefined : value)
            }
            value={sortBy === undefined ? "" : sortBy}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {table.headers.map((header) => (
                  <SelectItem value={header} key={header}>
                    {header}
                  </SelectItem>
                ))}
                <SelectItem value={"None"}>None</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setOrder(value == "Ascending" ? "Ascending" : "Descending");
            }}
            value={order}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Ascending">Ascending</SelectItem>
                <SelectItem value="Descending">Descending</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {table.headers.map((header, index) => (
              <TableHead key={index + header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(sortedData[table.headers[0]]).map((rowIndex) => (
            <TableRow key={rowIndex + table.headers[0]}>
              {table.headers.map((header, colIndex) => (
                <TableCell key={colIndex + header}>
                  {sortedData[header][rowIndex]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
