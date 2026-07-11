'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconUpload, IconTrash, IconFile, IconFileTypePdf, IconPhoto, IconDownload, IconPlus } from '@tabler/icons-react';
import type { MediaItem } from '@/types/claim.types';

interface Props {
  title?: string;
  entityId: string;
  uploadUrl: string;
  deleteUrlFn: (mediaId: number) => string;
  initialDocuments?: MediaItem[];
  accept?: string;
  maxFiles?: number;
  onRefresh?: () => void;
  compact?: boolean;
  /** Multipart field name expected by the backend endpoint (defaults to "documents", matching the generic documents[] collections). */
  fieldName?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <IconPhoto className="h-4 w-4 text-blue-500" />;
  if (mimeType === 'application/pdf') return <IconFileTypePdf className="h-4 w-4 text-red-500" />;
  return <IconFile className="h-4 w-4 text-gray-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsSection({
  title = 'Documents',
  entityId,
  uploadUrl,
  deleteUrlFn,
  initialDocuments = [],
  accept = '*/*',
  maxFiles = 10,
  onRefresh,
  compact = false,
  fieldName = 'documents',
}: Props) {
  const [documents, setDocuments] = useState<MediaItem[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append(`${fieldName}[]`, f));
      // Do NOT set Content-Type manually — Axios sets multipart/form-data + boundary automatically
      const res = await apiClient.post(uploadUrl, formData);
      const newDocs = res.data?.data ?? [];
      setDocuments(prev => [...prev, ...newDocs]);
      toast.success(`${files.length} document(s) téléversé(s)`);
      onRefresh?.();
    } catch {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (mediaId: number) => {
    setDeletingId(mediaId);
    try {
      await apiClient.delete(deleteUrlFn(mediaId));
      setDocuments(prev => prev.filter(d => d.id !== mediaId));
      toast.success('Document supprimé');
      onRefresh?.();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className={compact ? 'border-dashed' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className={compact ? 'text-sm' : 'text-base'}>
          {title}
          {documents.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">{documents.length}</Badge>
          )}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center gap-1.5 text-xs">Envoi…</span>
          ) : (
            <>
              <IconPlus className="h-3.5 w-3.5 mr-1" />
              Ajouter
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
            <p className="text-xs text-muted-foreground">Cliquer pour ajouter des documents</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-muted/30 transition-colors group"
              >
                <div className="flex-shrink-0">{getFileIcon(doc.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a href={doc.url} target="_blank" rel="noreferrer" download>
                      <IconDownload className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
