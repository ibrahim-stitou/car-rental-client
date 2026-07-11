'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateVehicle, useUpdateVehicle } from '../hooks/use-vehicles';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { Vehicle } from '@/types/vehicle.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/components/shared/select-field';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  VEHICLE_CATEGORY_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS,
} from '@/config/constants';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import { applyServerErrors } from '@/lib/form-errors';
import { RichTextEditor } from '@/components/shared/rich-text-editor';
import { IconUpload, IconX, IconPhoto, IconAlertTriangle } from '@tabler/icons-react';

const schema = z.object({
  agency_id: z.string().min(1, 'Agence requise'),
  brand: z.string().min(1, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  year: z.coerce.number().min(2000).max(new Date().getFullYear() + 1),
  registration_number: z.string().min(1, 'Immatriculation requise'),
  vin: z.string().optional(),
  color: z.string().optional(),
  category: z.string().min(1, 'Catégorie requise'),
  fuel_type: z.string().min(1, 'Carburant requis'),
  transmission: z.string().min(1, 'Transmission requise'),
  seats: z.coerce.number().min(2).max(9),
  daily_rate: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  mileage: z.coerce.number().min(0),
  average_consumption: z.coerce.number().min(0).optional(),
  has_adblue: z.boolean().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  show_on_website: z.boolean().optional(),
  website_description: z.string().optional(),
  website_price_override: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSuccess?: () => void;
}

export function VehicleForm({ open, onOpenChange, vehicle, onSuccess }: Props) {
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle(vehicle?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];

  const [photos, setPhotos] = useState<Array<{ id?: number; url: string; file?: File; isNew?: boolean }>>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', brand: '', model: '', year: new Date().getFullYear(),
      registration_number: '', vin: '', color: '', category: '', fuel_type: '',
      transmission: '', seats: 5, daily_rate: 0, deposit_amount: 0, mileage: 0,
      average_consumption: undefined,
      has_adblue: false, notes: '', description: '',
      show_on_website: false, website_description: '', website_price_override: undefined,
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        agency_id: vehicle.agency_id ?? vehicle.agency?.id ?? '',
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        registration_number: vehicle.registration_number,
        vin: vehicle.vin ?? '',
        color: vehicle.color ?? '',
        category: vehicle.category,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        seats: vehicle.seats,
        daily_rate: Number(vehicle.daily_rate),
        deposit_amount: Number(vehicle.deposit_amount),
        mileage: vehicle.mileage,
        average_consumption: (vehicle as any).average_consumption != null ? Number((vehicle as any).average_consumption) : undefined,
        has_adblue: vehicle.has_adblue ?? false,
        notes: vehicle.notes ?? '',
        description: vehicle.description ?? '',
        show_on_website: vehicle.show_on_website ?? false,
        website_description: vehicle.website_description ?? '',
        website_price_override: vehicle.website_price_override ? Number(vehicle.website_price_override) : undefined,
      });
      // Load existing photos
      setPhotos(vehicle.photos?.map(p => ({ id: Number(p.id), url: p.url })) ?? []);
    } else {
      form.reset({
        agency_id: '', brand: '', model: '', year: new Date().getFullYear(),
        registration_number: '', vin: '', color: '', category: '', fuel_type: '',
        transmission: '', seats: 5, daily_rate: 0, deposit_amount: 0, mileage: 0,
        average_consumption: undefined,
        has_adblue: false, notes: '', description: '',
        show_on_website: false, website_description: '',
      });
      setPhotos([]);
    }
  }, [vehicle, form, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
      isNew: true,
    }));
    setPhotos(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];
    if (photo.id && vehicle?.id) {
      try {
        await apiClient.delete(apiRoutes.vehiclesExt.deleteMedia(vehicle.id, photo.id));
        toast.success('Photo supprimée');
      } catch {
        toast.error('Erreur lors de la suppression');
        return;
      }
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (vehicleId: string) => {
    const newPhotos = photos.filter(p => p.isNew && p.file);
    if (newPhotos.length === 0) return;

    const formData = new FormData();
    newPhotos.forEach(p => formData.append('photos[]', p.file!));
    // Axios sets Content-Type + boundary automatically for FormData
    await apiClient.post(apiRoutes.vehiclesExt.photos(vehicleId), formData);
  };

  const onSubmit = async (values: FormValues) => {
    if (vehicle) {
      updateMutation.mutate(values as any, {
        onSuccess: async (res) => {
          const id = (res as any)?.data?.id ?? vehicle.id;
          if (photos.some(p => p.isNew)) {
            setUploadingPhotos(true);
            try { await uploadPhotos(id); } finally { setUploadingPhotos(false); }
          }
          toast.success('Véhicule mis à jour');
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour du véhicule'),
      });
    } else {
      createMutation.mutate(values as any, {
        onSuccess: async (res) => {
          const id = (res as any)?.data?.id;
          if (id && photos.some(p => p.isNew)) {
            setUploadingPhotos(true);
            try { await uploadPhotos(id); } finally { setUploadingPhotos(false); }
          }
          toast.success('Véhicule créé');
          onOpenChange(false);
          form.reset();
          onSuccess?.();
        },
        onError: (err) => applyServerErrors(err, form, 'Impossible de créer le véhicule'),
      });
    }
  };

  const isLoading = isPending || uploadingPhotos;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</SheetTitle>
          <SheetDescription>
            {vehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à la flotte'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Agency */}
              <FormField control={form.control} name="agency_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Agence *</FormLabel>
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner une agence"
                    options={agencies.map(a => ({ value: a.id, label: a.name, sub: (a as any).city }))}
                  />
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Informations du véhicule</p>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Marque *</FormLabel><FormControl><Input placeholder="Toyota" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modèle *</FormLabel><FormControl><Input placeholder="Corolla" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem><FormLabel>Année *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Couleur</FormLabel><FormControl><Input placeholder="Blanc" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="seats" render={({ field }) => (
                  <FormItem><FormLabel>Sièges *</FormLabel><FormControl><Input type="number" min={2} max={9} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="registration_number" render={({ field }) => (
                  <FormItem><FormLabel>N° immatriculation *</FormLabel><FormControl><Input placeholder="12345-A-1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="vin" render={({ field }) => (
                  <FormItem><FormLabel>VIN</FormLabel><FormControl><Input placeholder="17 caractères" maxLength={17} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>{VEHICLE_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fuel_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carburant *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>{FUEL_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>{TRANSMISSION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* AdBlue */}
              <FormField control={form.control} name="has_adblue" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-blue-50 border-blue-200">
                  <div>
                    <FormLabel className="text-blue-800 font-medium">Véhicule AdBlue</FormLabel>
                    <p className="text-xs text-blue-600 mt-0.5">Ce véhicule utilise le système AdBlue (urée)</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Tarification & État</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField control={form.control} name="daily_rate" render={({ field }) => (
                  <FormItem><FormLabel>Tarif/jour (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="deposit_amount" render={({ field }) => (
                  <FormItem><FormLabel>Caution (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mileage" render={({ field }) => (
                  <FormItem><FormLabel>Kilométrage (km) *</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="average_consumption" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consommation moyenne (L/100km)</FormLabel>
                    <FormControl><Input type="number" min={0} step={0.1} placeholder="ex. 6.5" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes internes</FormLabel><FormControl><Textarea placeholder="Informations complémentaires…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Description détaillée du véhicule…" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Photos section */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Photos du véhicule</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <IconUpload className="h-4 w-4 mr-1.5" />Ajouter photos
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoSelect} />
                </div>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border bg-muted aspect-video">
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                        {photo.isNew && (
                          <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-green-500">Nouveau</Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconPhoto className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Cliquer pour ajouter des photos</p>
                  </div>
                )}
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Paramètres site web</p>

              <FormField control={form.control} name="show_on_website" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Afficher sur le site web</FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">Afficher ce véhicule sur le site public</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="website_price_override" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix spécial site web (MAD)</FormLabel>
                    <FormControl><Input type="number" min={0} placeholder="Laisser vide = tarif journalier" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="website_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description site web</FormLabel>
                  <FormControl>
                    <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Description telle qu'affichée sur le site public…" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (uploadingPhotos ? 'Upload photos…' : 'Enregistrement…') : vehicle ? 'Mettre à jour' : 'Créer le véhicule'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
