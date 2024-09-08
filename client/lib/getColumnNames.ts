import readXlsxFile from "read-excel-file";
import Papa from "papaparse";
import { asyncBufferFromFile, parquetMetadata, parquetRead } from "hyparquet";

export async function getExcelColumnNames(file: File) {
  const data = await readXlsxFile(file);
  const headers = data[0] as Array<string>;
  const headersAndTypes: { header: string; type: "number" | "string" }[] = [];

  headers.forEach((header, index) => {
    const type = determineColumnTypeExcel(data.slice(1), index);
    headersAndTypes.push({ header, type });
  });

  return headersAndTypes;
}

export async function getCSVColumnNames(
  file: File
): Promise<{ header: string; type: "number" | "string" }[]> {
  return await new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: function (results) {
        const headersAndTypes: { header: string; type: "number" | "string" }[] =
          [];
        if (results.meta && results.meta.fields) {
          results.meta.fields.forEach((header) => {
            const type = determineColumnTypeCSV(results.data, header);
            headersAndTypes.push({ header, type });
          });
          resolve(headersAndTypes);
        } else {
          reject(new Error("No column names found"));
        }
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

// export async function getParquetColumnNames(file: File) {
//   const reader = new FileReader();
//   reader.readAsArrayBuffer(file);
//   return (reader.onload = async () => {
//     const buffer = reader.result as ArrayBuffer;
//     const metadata = parquetMetadata(buffer);
//     const columnNames = metadata.schema
//       .map((field: { name: string }) => field.name)
//       .splice(1, 1);
//     return columnNames;
//   });
// }

export async function getParquetColumnNames(
  file: File
): Promise<{ header: string; type: "number" | "string" }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const metadata = parquetMetadata(buffer);
        const schema = metadata.schema;
        const columnNames = metadata.schema
          .map((field: { name: string }) => field.name)
          .splice(1, 1);
        parquetRead({
          file: buffer,
          columns: schema.map((field: { name: string }) => field.name),
          onComplete: (data) => {
            const firstRow = data[0];
            const headersAndTypes: {
              header: string;
              type: "number" | "string";
            }[] = [];
            schema.forEach((field: { name: string }, index) => {
              const header = field.name;
              const value = firstRow[index];
              const type: "number" | "string" =
                typeof value === "number" || !isNaN(Number(value))
                  ? "number"
                  : "string";
              headersAndTypes.push({ header, type });
            });

            console.log(headersAndTypes);
            resolve(headersAndTypes);
          },
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsArrayBuffer(file);
  });
}

function determineColumnType(
  rows: any[][],
  columnIndex: number
): "number" | "string" {
  for (const row of rows) {
    const value = row[columnIndex];
    if (value !== undefined && value !== null) {
      if (typeof value === "number" || !isNaN(Number(value))) {
        return "number";
      } else {
        return "string";
      }
    }
  }
  // Default to string if no values are found or all values are undefined/null
  return "string";
}

function determineColumnTypeCSV(
  data: any[],
  header: string
): "number" | "string" {
  for (const row of data) {
    const value = row[header];
    if (value !== undefined && value !== null) {
      if (!isNaN(Number(value))) {
        return "number";
      } else {
        return "string";
      }
    }
  }
  return "string";
}

function determineColumnTypeExcel(
  rows: any[][],
  columnIndex: number
): "number" | "string" {
  for (const row of rows) {
    const value = row[columnIndex];
    if (value !== undefined && value !== null) {
      if (typeof value === "number" || !isNaN(Number(value))) {
        return "number";
      } else {
        return "string";
      }
    }
  }
  return "string";
}
