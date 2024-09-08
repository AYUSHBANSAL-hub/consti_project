"use client";

import FileUpload from "@/components/landingPage/fileUpload";
import { Button } from "@/components/ui/button";
import OrSeparator from "@/components/ui/orSeparator";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/loader";
import { useGMDMappingStore } from "@/lib/stores/mappingStore";
import { gmdDict } from "@/lib/constants/gmdDict";

interface Data {
  Mapped: Record<string, string>;
  Misc_needed: string[];
  Unmapped: string[];
  dataTypes: Record<string, string>;
  filename: string;
}

export default function Home() {
  const [files, setFiles] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const { pushMap, clearMapping } = useGMDMappingStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    clearMapping();
  }, []);

  const handleFileChange = (index: number, file: File | null) => {
    setFiles((prev) => {
      const updatedFiles = [...prev];
      updatedFiles[index] = file;
      return updatedFiles;
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addNewFileField = () => {
    setFiles((prev) => [...prev, null]);
  };

  const validateFiles = () => {
    if (files.every((file) => file != null)) {
      return true;
    }
    toast({
      title: "Error",
      description: "Please select files",
      variant: "destructive",
    });
    return false;
  };

  const processUploadResponse = async (response: Response) => {
    const data = (await response.json()) as Record<string, Data>;
    const gmdKeys = [
      ...Object.keys(gmdDict.dimensions),
      ...Object.keys(gmdDict.metric),
      ...Object.keys(gmdDict.ID),
    ];

    Object.values(data).forEach((item) => {
      const unMappedHeaders = gmdKeys.filter(
        (key) => !(Object.values(item.Mapped) as string[]).includes(key)
      );
      const requiredColumns = Object.fromEntries(
        item.Misc_needed.map((key) => [key, ""])
      );

      pushMap({
        columnTypes: item.dataTypes,
        fileName: item.filename,
        isMappingCorrect: null,
        mappedColumns: item.Mapped,
        unMappedColumns: item.Unmapped,
        unMappedHeaders,
        requiredColumns,
      });
    });

    router.push("/mappings");
  };

  const uploadFiles = async () => {
    if (!validateFiles()) return;

    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => file && formData.append("file", file));

    try {
      const response = await fetch("http://localhost:4999/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload files");

      await processUploadResponse(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex relative flex-row items-center h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <Spinner size="large" />
        </div>
      )}
      
      <div className="flex-col flex items-center h-screen justify-center p-8 rounded-md border-2 gap-2 shadow-sm">
        <h1 className="text-3xl font-bold">Upload Files</h1>
        <Separator />
        <h2 className="my-3">Upload from your computer</h2>
        <Button onClick={addNewFileField} className="bg-blue-500">
          Upload Files
        </Button>

        <OrSeparator />
        <h2 className="my-3">Upload from cloud</h2>
        <CloudUploadDialog />
      </div>

      <div className="flex-col flex items-center flex-1 gap-2">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-purple-500 bg-clip-text leading-tight text-transparent">
          Hello, Arijit!
        </h1>
        <p className="text-lg">How can I help you today?</p>
        <div className="grid gap-4 grid-cols-1 mt-10">
          {files.map((file, index) => (
            <FileUpload
              key={index}
              index={index}
              file={file}
              handleFileChange={(event) => handleFileChange(index, event)}
              handleRemoveFile={() => handleRemoveFile(index)}
            />
          ))}

          <AddFileButton
            addNewFileField={addNewFileField}
            disableAdd={files.length === 5 || files[files.length - 1] === null}
          />
        </div>

        <Button
          variant="default"
          className="mt-10"
          disabled={files.every((file) => file == null)}
          onClick={uploadFiles}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

const AddFileButton = ({
  addNewFileField,
  disableAdd,
}: {
  addNewFileField: () => void;
  disableAdd: boolean;
}) => (
  <div className="flex items-center justify-center">
    <Button
      onClick={addNewFileField}
      disabled={disableAdd}
      className="w-fit rounded-full h-fit py-4"
    >
      <Plus className="w-6 h-6 p-0 m-0" />
    </Button>
  </div>
);

const CloudUploadDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button className="bg-blue-500">Connect to cloud</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Connect to cloud</DialogTitle>
        <DialogDescription>
          Connect to cloud to upload files
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-3">
        <Button variant="outline">Connect with any database</Button>
        <Button variant="outline">Connect with drive</Button>
        <Button variant="outline">Connect with GCS</Button>
      </div>
    </DialogContent>
  </Dialog>
);