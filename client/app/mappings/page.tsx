"use client";
import { Spinner } from "@/components/ui/loader";

import { GMDMapState, useGMDMappingStore } from "@/lib/stores/mappingStore";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import ManualMapping from "@/components/mapping/manualMapping";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mapping, clearMapping } = useGMDMappingStore();

  const router = useRouter();

  // async function getHeaders() {
  //   // if (mapping.length > 0) {
  //   //   setLoading(false);
  //   //   return;
  //   // }
  //   const promises = globalFiles.map(async (file) => {
  //     const type = FileType({
  //       files: file,
  //     });
  //     if (type === "CSV") {
  //       return {
  //         fileName: file.name,
  //         headers: await getCSVColumnNames(file),
  //       };
  //     } else if (type === "EXCEL") {
  //       return {
  //         fileName: file.name,
  //         headers: await getExcelColumnNames(file),
  //       };
  //     } else if (type === "PARQUET") {
  //       return {
  //         fileName: file.name,
  //         headers: await getParquetColumnNames(file),
  //       };
  //     }
  //     return {
  //       fileName: file.name,
  //       headers: [],
  //     };
  //   });

  //   const results = await Promise.all(promises);
  //   initData(results);
  //   setLoading(false);
  // }

  async function sendMapping() {
    const obj: {
      [key: string]: {
        Mapped: {
          [key: string]: string;
        };
        Misc_needed: {
          [key: string]: string;
        };
      };
    } = {};

    mapping.forEach((m, index) => {
      obj[index.toString()] = {
        Mapped: m.mappedColumns,
        Misc_needed: m.requiredColumns,
      };
    });

    try {
      const res = await fetch("http://localhost:4999/finalize_upload", {
        body: JSON.stringify({
          mappings: obj,
        }),
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        router.push("/search");
      } else {
        setError(res.statusText);
      }
    } catch (error) {
      console.error(error);
      setError("Internal Server Error: 500");
    }
  }
  useEffect(() => {
    if (mapping.filter((m) => m.isMappingCorrect != true).length === 0) {
      setLoading(true);
      sendMapping();
      // router.push("/search");
    }
  }, [mapping]);

  return error != null ? (
    <div className="h-screen flex items-center justify-center w-full bg-gray-100">
      <div className="border  bg-white shadow-lg rounded-lg flex flex-col justify-start items-center p-6 space-y-6">
        <TriangleAlert className="w-14 h-14 text-red-500" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Oops! Something went wrong
        </h1>
        <p className="text-sm text-gray-600">{error}</p>
        <Button
          onClick={() => {
            clearMapping();
            router.push("/");
          }}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
        >
          Go Back to Home
        </Button>
      </div>
    </div>
  ) : loading ? (
    <div className="h-screen flex items-center justify-center w-full">
      <Spinner size={"large"} />
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      {mapping
        .filter((m) => m.isMappingCorrect == null)
        .slice(0, 1)
        .map((m) => (
          <div
            key={m.fileName}
            className="flex flex-col p-4 m-6 border-2 rounded-md"
          >
            <h1 className="text-2xl font-bold self-start mb-4">{m.fileName}</h1>
            <ManualMapping gmState={m} />
          </div>
        ))}
    </div>
  );
}
