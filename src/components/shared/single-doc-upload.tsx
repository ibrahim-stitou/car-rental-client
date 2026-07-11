'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { IconUpload, IconFileTypePdf, IconExternalLink } from '@tabler/icons-react';

interface Props {
  label: string;
  /** FormData field name expected by the backend endpoint (e.g. "policy_document"). */
  fieldName: string;
  uploadUrl: string;
  currentUrl?: string | null;
  accept?: string;
  onUploaded?: (url: string) => void;
}

/** Small single-file upload widget for spatie singleFile() media collections (one dedicated field per endpoint). */
export function SingleDocUpload({ label, fieldName, uploadUrl, currentUrl, accept = 'application/pdf', onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null | undefined>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      const res = await apiClient.post(uploadUrl, formData);
      const newUrl = res.data?.data?.url ?? null;
      setUrl(newUrl);
      if (newUrl) onUploaded?.(newUrl);
      toast.success(`${label} téléversé`);
    } catch {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg text-sm">
      <span className="flex items-center gap-2"><IconFileTypePdf className="h-4 w-4 text-muted-foreground" />{label}</span>
      <div className="flex items-center gap-1.5">
        {url && (
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noreferrer"><IconExternalLink className="h-3.5 w-3.5 mr-1" />Voir</a>
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <IconUpload className="h-3.5 w-3.5 mr-1" />{uploading ? 'Envoi…' : url ? 'Remplacer' : 'Ajouter'}
        </Button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      </div>
    </div>
  );
}
