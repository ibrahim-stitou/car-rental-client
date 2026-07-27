'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { IconUpload, IconX, IconFile, IconFileTypePdf, IconPhoto } from '@tabler/icons-react';

interface Props {
  label: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <IconPhoto className="h-4 w-4 text-blue-500" />;
  if (mimeType === 'application/pdf') return <IconFileTypePdf className="h-4 w-4 text-red-500" />;
  return <IconFile className="h-4 w-4 text-gray-500" />;
}

/**
 * Lets the user pick file(s) before the parent record exists (no id to upload
 * against yet) — the parent stages them and uploads to the real endpoints
 * once the record is created.
 */
export function StagedFileInput({ label, accept = '*/*', multiple = false, files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    onChange(multiple ? [...files, ...picked] : [picked[0]]);
    e.target.value = '';
  };

  const remove = (index: number) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg text-sm gap-3">
      <span className="flex-1 min-w-0">
        <span className="block">{label}</span>
        {files.length > 0 && (
          <span className="mt-1.5 flex flex-col gap-1">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {getFileIcon(f.type)}
                <span className="truncate">{f.name}</span>
                <span>({(f.size / 1024).toFixed(0)} KB)</span>
                <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-600">
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </span>
        )}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
        <IconUpload className="h-3.5 w-3.5 mr-1" />{multiple ? 'Ajouter' : files.length ? 'Remplacer' : 'Choisir'}
      </Button>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handlePick} />
    </div>
  );
}
