export function FileType({
  files,
  ifCsv,
  ifExcel,
  ifParquet,
}: {
  files: File;
  ifCsv?: (file: File) => void;
  ifExcel?: (file: File) => void;
  ifParquet?: (file: File) => void;
}): "CSV" | "EXCEL" | "PARQUET" | null {
  if (files.type === "text/csv") {
    if (ifCsv) {
      ifCsv(files);
    }
    return "CSV";
  }

  if (
    files.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    if (ifExcel) {
      ifExcel(files);
    }
    return "EXCEL";
  }
  if (files.type === "application/vnd.ms-excel") {
    if (ifExcel) {
      ifExcel(files);
    }
    return "EXCEL";
  }
  const fileExtension = files.name.slice(
    ((files.name.lastIndexOf(".") - 1) >>> 0) + 2
  );
  if (fileExtension == "parquet") {
    if (ifParquet) {
      ifParquet(files);
    }
    return "PARQUET";
  }

  return null;
}
