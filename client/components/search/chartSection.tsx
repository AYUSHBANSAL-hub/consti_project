import { Result } from "@/app/search/page";
import SearchLineChart from "./lineChart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { Button } from "../ui/button";
export default function ChartSection({
  chat,
  onClick,
  DimensionList,
  MetricList,
  index,
}: {
  chat: Result;
  DimensionList: string[];
  MetricList: string[];
  onClick: (groupBy: string, breakdown: string, metric: string) => void;
  index: number;
}) {
  const [value, setValue] = useState<"line-chart" | "bar-chart">("line-chart");

  const [groupBy, setGroupBy] = useState<string>(
    chat.selectedFilter?.selectedGroupBy ?? DimensionList[0]
  );
  const [breakdown, setBreakdown] = useState<string>(
    chat.selectedFilter?.selectedBreakdown ??
      DimensionList[1] ??
      DimensionList[0]
  );
  const [metric, setMetric] = useState<string>(
    chat.selectedFilter?.selectedMetric ?? MetricList[0]
  );
  return (
    <Tabs
      defaultValue="line-chart"
      onValueChange={(value) => setValue(value as "line-chart" | "bar-chart")}
      value={value}
      className="flex justify-between items-start flex-col "
    >
      <div className="self-stretch flex flex-col justify-between  p-3">
        <p className="text-sm text-gray-500 mb-2">Chart</p>

        <div className="flex flex-row justify-between">
          <div className=" flex flex-row gap-5">
            <Select
              value={groupBy}
              onValueChange={(value) => setGroupBy(value)}
            >
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DimensionList.map((header) => (
                    <SelectItem value={header} key={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={breakdown}
              onValueChange={(value) => setBreakdown(value)}
            >
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Breakdown" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DimensionList.map((header) => (
                    <SelectItem value={header} key={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={metric} onValueChange={(value) => setMetric(value)}>
              <SelectTrigger className="min-w-[140px]">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MetricList.map((header) => (
                    <SelectItem value={header} key={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button onClick={() => onClick(groupBy, breakdown, metric)}>
              Apply
            </Button>
          </div>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="line-chart">Trend Line</TabsTrigger>
            <TabsTrigger value="bar-chart">Breakdown</TabsTrigger>
          </TabsList>
        </div>
      </div>
      <SearchLineChart index={index} id={chat.title} chartData={chat.chart} />
    </Tabs>
  );
}
