import { getMetadata, gmdDict } from "./constants/gmdDict";

export default function GMDMapper(
  inputStrings: { header: string; type: "number" | "string" }[]
): {
  mappedColumns: { [key: string]: string };
  unMappedColumns: string[];
  unMappedHeaders: string[];
  columnTypes: { [key: string]: string };
} {
  const mappedColumns: { [key: string]: string } = {};
  const unMappedColumns: string[] = [];
  const usedHeaders: Set<string> = new Set();
  const columnsType: { [key: string]: string } = {};

  for (const input of inputStrings) {
    columnsType[input.header] = input.type;
    let matched = false;

    for (const category in gmdDict) {
      const headers = gmdDict[category];

      for (const headerKey in headers) {
        const regexArray = headers[headerKey];

        for (const regex of regexArray) {
          if (regex.test(input.header)) {
            mappedColumns[headerKey] = input.header;
            usedHeaders.add(headerKey);
            matched = true;
            break;
          }
        }

        if (matched) break;
      }

      if (matched) break;
    }

    if (!matched) {
      unMappedColumns.push(input.header);
    }
  }

  const unMappedHeaders = Object.keys(gmdDict)
    .flatMap((category) => Object.keys(gmdDict[category]))
    .filter((header) => !usedHeaders.has(header));

  return {
    mappedColumns,
    columnTypes: columnsType,
    unMappedColumns,
    unMappedHeaders,
  };
}
