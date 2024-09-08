import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
export default function SearchLineChart({
  chartData,
  id,
  index,
}: {
  chartData: {
    [key: string]: {
      data: {
        [date: string]: number;
      };
    };
  };
  id: string;
  index: number;
}) {
  const chartRef = useRef<Chart<"line", any, string> | null>(null);

  useEffect(() => {
    const ctx = document.getElementById(
      "lineChart-search" + id + index.toString()
    ) as HTMLCanvasElement;
    const labels = Object.keys(chartData[Object.keys(chartData)[0]].data);
    const datasets = Object.keys(chartData).map((key) => ({
      label: key,
      data: Object.values(chartData[key].data),
      fill: false,
    }));
    if (ctx) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: datasets,
        },
      });
    }

    // Cleanup function to destroy the chart instance when the component unmounts
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);
  return <canvas id={"lineChart-search" + id + index.toString()}></canvas>;
}
