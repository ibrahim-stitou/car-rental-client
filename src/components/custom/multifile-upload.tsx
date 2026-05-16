'use client';

import * as React from 'react';
import { FileWithPath, useDropzone } from 'react-dropzone';
import {
  ArrowDownToLine,
  Eye,
  FileText,
  GripVertical,
  UploadCloud,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { cn, formatBytes } from '@/lib/utils';
import type { UploadedFile } from '@/components/custom/singlefile-upload';

export interface MultiFileUploadProps {
  value?: UploadedFile[];
  onFilesChangeAction: (files: UploadedFile[]) => void;
  maxSize?: number; // MB
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  accept?: Record<string, string[]>;
  description?: string;
  label?: string;
  collection?: string;
  showPreview?: boolean;
}

function uniqByPathOrName(files: UploadedFile[]) {
  const seen = new Set<string>();
  const out: UploadedFile[] = [];
  for (const f of files) {
    const key = f.path || `${f.name}:${f.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function MultiFileUpload({
  value,
  onFilesChangeAction,
  maxSize = 10,
  maxFiles = 10,
  disabled = false,
  className,
  accept = { 'application/pdf': ['.pdf'] },
  description,
  label,
  collection = 'default',
  showPreview = false,
}: MultiFileUploadProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [files, setFiles] = React.useState<UploadedFile[]>(value || []);

  React.useEffect(() => {
    setFiles(value || []);
  }, [value]);

  const uploadSingle = React.useCallback(async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('collection', collection);

    const response = await apiClient.post(apiRoutes.files.uploadTemp, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const uploaded: UploadedFile = {
      ...response.data,
      file: fileToUpload,
      collection_name: collection,
      uploaded: true,
    };

    return uploaded;
  }, [collection]);

  const cleanupTemps = async (paths: string[]) => {
    const clean = paths.filter(Boolean);
    if (clean.length === 0) return;
    await apiClient.post(apiRoutes.files.cleanupTemp, { paths: clean });
  };

  const onDrop = React.useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      setError(null);
      if (acceptedFiles.length === 0) {
        setError('No valid file selected');
        return;
      }

      const currentCount = files.length;
      if (currentCount + acceptedFiles.length > maxFiles) {
        setError(`Too many files. Max: ${maxFiles}`);
        return;
      }

      const tooBig = acceptedFiles.find((f) => f.size > maxSize * 1024 * 1024);
      if (tooBig) {
        setError(`File too large. Max: ${maxSize}MB`);
        return;
      }

      setIsUploading(true);
      try {
        const uploaded = await Promise.all(
          acceptedFiles.map((f) => uploadSingle(f))
        );

        const next = uniqByPathOrName([...(files || []), ...uploaded]);
        setFiles(next);
        onFilesChangeAction(next);
      } catch (e: any) {
        console.error('Multi upload failed', e);
        setError(e?.response?.data?.message || 'Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [files, maxFiles, maxSize, onFilesChangeAction, uploadSingle]
  );

  const removeFile = async (idx: number) => {
    const target = files[idx];
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFilesChangeAction(next);

    try {
      if (target?.path) {
        await cleanupTemps([target.path]);
      }
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFiles(next);
    onFilesChangeAction(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSize * 1024 * 1024,
    maxFiles,
    disabled: disabled || isUploading,
  });

  const help = description || 'Drag & drop files here, or click to browse';

  return (
    <div className={cn('space-y-3', className)}>
      {label && <div className="font-medium text-sm">{label}</div>}

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors bg-white',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isUploading ? 'Uploading...' : help}
          </p>
          <p className="text-xs text-muted-foreground">
            Limits: {maxFiles} files • {maxSize}MB
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => (
            <div
              key={f.path || `${f.name}-${idx}`}
              className="group flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.mime_type}  {formatBytes(f.size)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {f.url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(f.url as string, '_blank')}
                  >
                    {showPreview ? (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Download
                      </>
                    )}
                  </Button>
                )}

                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === files.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFile(idx)}
                  disabled={disabled || isUploading}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
