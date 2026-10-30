'use client';

import { useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import { toast } from 'sonner';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CustomAlertDialog from '@/components/custom/customAlert';
import { cn } from '@/lib/utils';
import type { PhotoOwnerType, WebsitePhoto } from '@/types/website.types';
import { useWebsitePhotos } from '../hooks/use-website';
import { toastWebsiteError } from '../utils';

const MIN_WIDTH = 1200;

interface Props {
  type: PhotoOwnerType;
  ownerId: string;
  photos: WebsitePhoto[];
  /** Nombre de photos exigé par la checklist. */
  minimum?: number;
}

/** Largeur réelle d'une image, pour refuser avant envoi ce que l'API refusera. */
function imageWidth(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve(img.naturalWidth); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(0); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export function PhotoManager({ type, ownerId, photos, minimum }: Props) {
  const { upload, reorder, update, remove } = useWebsitePhotos(type, ownerId);
  const [items, setItems] = useState(photos);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { setItems(photos); }, [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    const widths = await Promise.all(files.map(imageWidth));
    const accepted = files.filter((_, i) => widths[i] >= MIN_WIDTH);
    const refused = files.length - accepted.length;
    if (refused > 0) {
      toast.warning(`${refused} photo(s) ignorée(s) : largeur minimale ${MIN_WIDTH} px.`);
    }
    if (accepted.length === 0) return;

    upload.mutate(accepted, {
      onSuccess: (res) => toast.success(res.message ?? 'Photos ajoutées'),
      onError: (err) => toastWebsiteError(err, "Échec de l'envoi des photos"),
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((p) => p.id === active.id);
    const to = items.findIndex((p) => p.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    reorder.mutate(next.map((p) => p.id), {
      onError: (err) => { setItems(photos); toastWebsiteError(err, "Impossible d'enregistrer l'ordre"); },
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    remove.mutate(deleteId, {
      onSuccess: () => toast.success('Photo supprimée'),
      onError: (err) => toastWebsiteError(err, 'Suppression impossible'),
    });
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Photos du site</span>
          <span className={cn('text-xs font-normal', minimum && items.length < minimum ? 'text-amber-600' : 'text-muted-foreground')}>
            {items.length} photo(s){minimum ? ` · ${minimum} minimum` : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dropzone
          onDrop={handleDrop}
          accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
          maxSize={8 * 1024 * 1024}
          maxFiles={15}
          disabled={upload.isPending}
          onDropRejected={() => toast.error('Formats acceptés : JPEG, PNG, WebP, 8 Mo maximum.')}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/40',
              )}
            >
              <input {...getInputProps()} />
              {upload.isPending
                ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
              <p className="text-sm font-medium">Glissez vos photos ici ou cliquez pour choisir</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP · largeur ≥ {MIN_WIDTH} px · 8 Mo max</p>
            </div>
          )}
        </Dropzone>

        {items.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              Faites glisser les photos pour changer leur ordre. L&apos;étoile désigne la photo de couverture.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map((photo) => (
                    <SortablePhoto
                      key={photo.id}
                      photo={photo}
                      onCover={() => update.mutate(
                        { mediaId: photo.id, data: { is_cover: true } },
                        { onError: (err) => toastWebsiteError(err, 'Modification impossible') },
                      )}
                      onAlt={(alt) => update.mutate(
                        { mediaId: photo.id, data: { alt: alt || null } },
                        { onSuccess: () => toast.success('Texte alternatif enregistré'), onError: (err) => toastWebsiteError(err) },
                      )}
                      onDelete={() => setDeleteId(photo.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </CardContent>

      <CustomAlertDialog
        title="Supprimer la photo ?"
        description="Elle sera retirée du site."
        confirmText="Supprimer"
        cancelText="Annuler"
        open={deleteId !== null}
        setOpen={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}

function SortablePhoto({ photo, onCover, onAlt, onDelete }: {
  photo: WebsitePhoto;
  onCover: () => void;
  onAlt: (alt: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const [alt, setAlt] = useState(photo.alt ?? '');

  useEffect(() => { setAlt(photo.alt ?? ''); }, [photo.alt]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('rounded-lg border bg-card overflow-hidden', isDragging && 'z-10 shadow-lg opacity-80')}
    >
      <div className="relative aspect-video bg-muted">
        <img src={photo.thumb || photo.url} alt={photo.alt ?? ''} className="h-full w-full object-cover" />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute left-1.5 top-1.5 rounded bg-black/50 p-1 text-white cursor-grab active:cursor-grabbing"
          aria-label="Déplacer"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {photo.is_cover && (
          <Badge className="absolute right-1.5 top-1.5 bg-amber-500 text-white border-0 text-[10px]">Couverture</Badge>
        )}
      </div>
      <div className="p-2 space-y-2">
        <Input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => { if (alt !== (photo.alt ?? '')) onAlt(alt); }}
          placeholder="Texte alternatif"
          maxLength={150}
          className="h-8 text-xs"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            variant={photo.is_cover ? 'secondary' : 'outline'}
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={onCover}
            disabled={photo.is_cover}
          >
            <Star className={cn('h-3.5 w-3.5 mr-1', photo.is_cover && 'fill-amber-500 text-amber-500')} />
            {photo.is_cover ? 'Couverture' : 'Mettre en avant'}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
