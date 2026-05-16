import * as React from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { UploadCloud, X, FileText, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api";
import { apiRoutes } from "@/config/apiRoutes";

interface FileUploadProps {
  name: string;
  label?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
  collection?: string;
  modelType: string;
  modelId?: string | number;
  showTabs?: boolean;
  previewHeight?: string;
  onFilesChange?: (files: UploadedFile[]) => void;
  existingFiles?: Record<string, UploadedFile[]> | UploadedFile[]; // Added prop for existing files
}

interface UploadedFile {
  id?: number;
  name: string;
  url?: string;
  mime_type: string;
  size: number;
  file?: File;
  file_name?: string;
  collection_name?: string;
  created_at?: string;
  path?: string;
}

const DOCUMENT_TYPES = {
  id_documents: {
    label: "ID Documents",
    accept: { "application/pdf": [".pdf"] },
    description: "Upload your ID document (PDF only)",
    icon: <FileText className="h-6 w-6" />
  },
  social_security: {
    label: "Social Security",
    accept: { "application/pdf": [".pdf"] },
    description: "Upload your social security document (PDF only)",
    icon: <FileText className="h-6 w-6" />
  },
  cv: {
    label: "CV/Resume",
    accept: { "application/pdf": [".pdf"] },
    description: "Upload your resume or CV (PDF only)",
    icon: <FileText className="h-6 w-6" />
  },
  iban_documents: {
    label: "IBAN Documents",
    accept: { "application/pdf": [".pdf"] },
    description: "Upload your bank account details (PDF only)",
    icon: <FileText className="h-6 w-6" />
  }
};

export function FileUpload({
  name,
  label,
  maxSize = 10,
  disabled = false,
  className,
  collection = "default",
  modelType,
  modelId,
  showTabs = true,
  previewHeight = "h-96",
  onFilesChange,
  existingFiles,
}: FileUploadProps) {
  const { setValue, watch } = useFormContext();
  const [error, setError] = React.useState<string | null>(null);
  const [currentCollection, setCurrentCollection] = React.useState(collection);
  const [isUploading, setIsUploading] = React.useState(false);

  // Get current files from form state
  const formFiles = watch(name) || [];
  const [files, setFiles] = React.useState<UploadedFile[]>(formFiles);

  // Initialize files with existing files from backend if available
  React.useEffect(() => {
    if (existingFiles) {
      let initialFiles: UploadedFile[] = [];

      if (Array.isArray(existingFiles)) {
        // If existingFiles is an array
        initialFiles = existingFiles;
      } else {
        // If existingFiles is a record with collection names as keys
        Object.values(existingFiles).forEach(collectionFiles => {
          initialFiles = [...initialFiles, ...collectionFiles];
        });
      }

      setValue(name, initialFiles, { shouldValidate: true });
      setFiles(initialFiles);
      onFilesChange?.(initialFiles);
    }
  }, [existingFiles, setValue, name, onFilesChange]);

  const uploadFile = async (file: File, collectionName: string) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collection', collectionName);

      const response = await apiClient.post(
        apiRoutes.files.uploadTemp,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        ...response.data,
        file, // keep original file reference
        collection_name: collectionName,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const getFileForCollection = (collectionName: string) => {
    return files.find(file => file.collection_name === collectionName);
  };

  const onDrop = React.useCallback(
    async (acceptedFiles: FileWithPath[], collectionName: string) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError("No valid PDF file selected");
        return;
      }

      const file = acceptedFiles[0];

      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }

      try {
        const uploadedFile = await uploadFile(file, collectionName);
        const updatedFiles = files.filter(f => f.collection_name !== collectionName);
        const finalFiles = [...updatedFiles, uploadedFile];

        setFiles(finalFiles);
        setValue(name, finalFiles, { shouldValidate: true });
        onFilesChange?.(finalFiles);
      } catch (error) {
        setError("File upload failed. Please try again.");
      }
    },
    [files, name, setValue, onFilesChange]
  );

  const removeFile = async (collectionName: string) => {
    const fileToRemove = files.find(f => f.collection_name === collectionName);
    const updatedFiles = files.filter(f => f.collection_name !== collectionName);

    try {
      if (fileToRemove?.path) {
        await apiClient.post(apiRoutes.files.cleanupTemp, {
          paths: [fileToRemove.path]
        });
      }
    } catch (error) {
      console.error('Failed to cleanup file:', error);
    }

    setFiles(updatedFiles);
    setValue(name, updatedFiles, { shouldValidate: true });
    onFilesChange?.(updatedFiles);
  };

  // Create individual dropzones for each document type at the top level of the component
  const idDocumentsDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'id_documents'),
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || !!getFileForCollection('id_documents') || isUploading,
  });

  const socialSecurityDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'social_security'),
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || !!getFileForCollection('social_security') || isUploading,
  });

  const cvDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'cv'),
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || !!getFileForCollection('cv') || isUploading,
  });

  const ibanDocumentsDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, 'iban_documents'),
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
    disabled: disabled || !!getFileForCollection('iban_documents') || isUploading,
  });

  // Map collection names to their respective dropzone instances
  const dropzones = React.useMemo(() => ({
    id_documents: idDocumentsDropzone,
    social_security: socialSecurityDropzone,
    cv: cvDropzone,
    iban_documents: ibanDocumentsDropzone,
  }), [idDocumentsDropzone, socialSecurityDropzone, cvDropzone, ibanDocumentsDropzone]);

  const renderDropzone = (collectionName: string) => {
    const currentFile = getFileForCollection(collectionName);
    const docTypeInfo = DOCUMENT_TYPES[collectionName as keyof typeof DOCUMENT_TYPES];
    const dropzone = dropzones[collectionName as keyof typeof dropzones];
    
    if (!dropzone) return null;

    if (currentFile) {
      return (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-medium">{currentFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {currentFile.url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(currentFile.url, '_blank')}
                  >
                    <ArrowDownToLine className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFile(collectionName)}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              PDF • {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              {currentFile.created_at && (
                <span className="ml-1">
                  • {new Date(currentFile.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="mt-4 border rounded bg-white">
              {currentFile.url ? (
                <iframe
                  src={currentFile.url}
                  className={`w-full ${previewHeight}`}
                  title={currentFile.name}
                />
              ) : currentFile.file ? (
                <iframe
                  src={URL.createObjectURL(currentFile.file)}
                  className={`w-full ${previewHeight}`}
                  title={currentFile.name}
                />
              ) : (
                <div className={`w-full ${previewHeight} flex items-center justify-center`}>
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const { getRootProps, getInputProps, isDragActive } = dropzone;

    return (
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : docTypeInfo?.description || "Upload PDF file"}
          </p>
          <p className="text-xs text-muted-foreground">
            Max size: {maxSize}MB • PDF only
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showTabs && (
        <Tabs
          defaultValue={collection}
          value={currentCollection}
          onValueChange={setCurrentCollection}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-3">
            {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
              <TabsTrigger key={key} value={key}>{value.label}</TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(DOCUMENT_TYPES).map(type => (
            <TabsContent key={type} value={type} className="mt-0">
              <div className="flex items-center gap-2 mb-2">
                {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES].icon}
                <h3 className="text-lg font-medium">
                  {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES].label}
                </h3>
              </div>

              {renderDropzone(type)}

              {error && currentCollection === type && (
                <p className="text-sm font-medium text-destructive text-center mt-2">{error}</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!showTabs && (
        <>
          {renderDropzone(currentCollection)}
          {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          )}
        </>
      )}
    </div>
  );
}