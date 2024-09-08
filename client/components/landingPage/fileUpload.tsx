import { Input } from "../ui/input";
import { CloudUpload, Info, X } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

export default function FileUpload({
  file,
  handleFileChange,
  handleRemoveFile,
  index,
}: {
  index: number;
  file: File | null;
  handleFileChange: (file: File) => void;
  handleRemoveFile: () => void;
}) {
  const { toast } = useToast();
  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/x-parquet",
  ];

  return (
    <div className="flex flex-row gap-3 justify-end">
      {index != 0 && (
        <Button variant={"ghost"} onClick={handleRemoveFile}>
          <X size={18} />
        </Button>
      )}
      <div className="flex flex-row justify-between gap-3">
        <Input
          type="file"
          id="file"
          name="file"
          accept=".csv, .xlsx, .xls, .parquet"
          onChange={(event) => {
            if (!event.target.files) return;
            if (!event.target.files[0]) return;
            if (!allowedMimeTypes.includes(event.target.files[0].type)) {
              if (event.target.files[0].type == "") {
                const fileExtension = event.target.files[0].name.slice(
                  ((event.target.files[0].name.lastIndexOf(".") - 1) >>> 0) + 2
                );
                if (fileExtension == "parquet") {
                  handleFileChange(event.target.files[0]);
                  return;
                }
              }
              toast({
                title: "File type not allowed",
                description: "Please upload a CSV, XLSX, XLS, Parquet file",
              });
              event.target.value = "";
              return;
            }
            handleFileChange(event.target.files[0]);
          }}
        />
        <p className="border p-2 rounded-md text-sm bg-white text-nowrap inline-flex items-center gap-2 text-gray-600">
          <Info size={18} color="#737373" />
          This is the file for something
        </p>
      </div>
    </div>
  );
}
