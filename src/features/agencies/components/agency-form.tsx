'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Trash2, X } from 'lucide-react';
import { useCreateAgency, useUpdateAgency, useUploadAgencyLogo, useDeleteAgencyMedia } from '../hooks/use-agencies';
import { agencyService } from '@/services/agency.service';
import type { Agency } from '@/types/agency.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { IconBuildingStore } from '@tabler/icons-react';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Téléphone requis'),
  phone2: z.string().optional(),
  address: z.string().min(1, 'Adresse requise'),
  city: z.string().min(1, 'Ville requise'),
  country: z.string().min(1, 'Pays requis'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency?: Agency | null;
  onSuccess?: () => void;
}

export function AgencyForm({ open, onOpenChange, agency, onSuccess }: Props) {
  const createMutation = useCreateAgency();
  const updateMutation = useUpdateAgency(agency?.id ?? '');
  const uploadLogo = useUploadAgencyLogo(agency?.id ?? '');
  const deleteLogo = useDeleteAgencyMedia(agency?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Edit mode — current logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoMediaId, setLogoMediaId] = useState<number | null>(null);
  const [delConfirm, setDelConfirm] = useState(false);

  // Create mode — staged logo
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', phone2: '', address: '', city: '', country: 'Morocco' },
  });

  useEffect(() => {
    if (agency) {
      form.reset({ name: agency.name, email: agency.email, phone: agency.phone, phone2: agency.phone2 ?? '', address: agency.address, city: agency.city, country: agency.country });
      setLogoUrl(agency.logo_url ?? null);
      setLogoMediaId(agency.logo_media_id ?? null);
    } else {
      form.reset({ name: '', email: '', phone: '', phone2: '', address: '', city: '', country: 'Morocco' });
      setLogoUrl(null);
      setLogoMediaId(null);
      setStagedFile(null);
      setStagedPreview(null);
    }
    setDelConfirm(false);
  }, [agency, form, open]);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => { if (stagedPreview) URL.revokeObjectURL(stagedPreview); };
  }, [stagedPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (agency) {
      // Edit mode: upload immediately
      uploadLogo.mutate(file, {
        onSuccess: (res) => {
          const updated = (res as any)?.data;
          setLogoUrl(updated?.logo_url ?? null);
          setLogoMediaId(updated?.logo_media_id ?? null);
          toast.success('Logo mis à jour');
        },
        onError: () => toast.error('Échec du téléversement du logo'),
      });
    } else {
      // Create mode: stage for upload after creation
      if (stagedPreview) URL.revokeObjectURL(stagedPreview);
      setStagedFile(file);
      setStagedPreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleDeleteLogo = () => {
    if (!logoMediaId) return;
    deleteLogo.mutate(logoMediaId, {
      onSuccess: () => {
        setLogoUrl(null);
        setLogoMediaId(null);
        setDelConfirm(false);
        toast.success('Logo supprimé');
      },
      onError: () => toast.error('Impossible de supprimer le logo'),
    });
  };

  const clearStagedLogo = () => {
    if (stagedPreview) URL.revokeObjectURL(stagedPreview);
    setStagedFile(null);
    setStagedPreview(null);
  };

  const onSubmit = (values: FormValues) => {
    if (agency) {
      updateMutation.mutate(values, {
        onSuccess: () => { toast.success('Agence mise à jour'); onOpenChange(false); onSuccess?.(); },
        onError: () => toast.error('Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: async (res) => {
          const newAgency = (res as any)?.data;
          if (stagedFile && newAgency?.id) {
            try { await agencyService.uploadLogo(newAgency.id, stagedFile); } catch { /* logo non bloquant */ }
          }
          toast.success('Agence créée');
          onOpenChange(false);
          form.reset();
          onSuccess?.();
        },
        onError: () => toast.error("Impossible de créer l'agence"),
      });
    }
  };

  const isEditMode = !!agency;
  const currentPreview = isEditMode ? logoUrl : stagedPreview;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEditMode ? "Modifier l'agence" : 'Ajouter une agence'}</SheetTitle>
          <SheetDescription>{isEditMode ? "Mettre à jour les informations de l'agence" : 'Créer une nouvelle agence de location'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-6 space-y-5">
            {/* Logo section */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Logo de l&apos;agence
                {!isEditMode && <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>}
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-xl overflow-hidden border bg-muted flex-shrink-0">
                  {currentPreview
                    ? <img src={currentPreview} alt="Logo" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center"><IconBuildingStore className="h-8 w-8 text-muted-foreground" /></div>
                  }
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}>
                    {uploadLogo.isPending ? 'Téléversement…' : currentPreview ? 'Remplacer le logo' : 'Téléverser un logo'}
                  </Button>

                  {/* Edit mode: delete existing logo */}
                  {isEditMode && logoUrl && !delConfirm && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 h-7 text-xs justify-start px-2" onClick={() => setDelConfirm(true)}>
                      <Trash2 className="h-3 w-3 mr-1" />Supprimer
                    </Button>
                  )}
                  {isEditMode && delConfirm && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">Confirmer ?</span>
                      <Button type="button" variant="destructive" size="sm" className="h-6 text-xs px-2" onClick={handleDeleteLogo} disabled={deleteLogo.isPending}>Oui</Button>
                      <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setDelConfirm(false)}>Non</Button>
                    </div>
                  )}

                  {/* Create mode: remove staged file */}
                  {!isEditMode && stagedFile && (
                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground h-7 text-xs justify-start px-2" onClick={clearStagedLogo}>
                      <X className="h-3 w-3 mr-1" />Retirer
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP · max 2 Mo</p>
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              <Separator />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nom de l&apos;agence *</FormLabel><FormControl><Input placeholder="Agence Casablanca" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="contact@agency.ma" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Téléphone (Tél/Fax) *</FormLabel><FormControl><Input placeholder="+212 5XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone2" render={({ field }) => (
                    <FormItem><FormLabel>GSM</FormLabel><FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Localisation</p>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Adresse *</FormLabel><FormControl><Input placeholder="123 Boulevard Mohammed V" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Ville *</FormLabel><FormControl><Input placeholder="Casablanca" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Pays *</FormLabel><FormControl><Input placeholder="Morocco" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Annuler</Button>
                  <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : isEditMode ? 'Mettre à jour' : "Créer l'agence"}</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
