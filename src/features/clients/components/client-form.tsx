'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { parseISO } from 'date-fns';
import { useCreateClient, useUpdateClient, useUploadIdDocument, useUploadDrivingLicense, useDeleteClientMedia } from '../hooks/use-clients';
import { clientService } from '@/services/client.service';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import type { Client } from '@/types/client.types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/file-uploader';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { IconArrowLeft, IconFileText } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

const schema = z.object({
  agency_id: z.string().min(1, 'Agence requise'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().min(1, 'Téléphone requis'),
  date_of_birth: z.string().optional(),
  birth_place: z.string().optional(),
  nationality: z.string().optional(),
  id_type: z.enum(['cin', 'passport', 'residence_permit']).optional(),
  id_number: z.string().optional(),
  id_expiry_date: z.string().optional(),
  driving_license_number: z.string().optional(),
  driving_license_category: z.string().optional(),
  driving_license_expiry: z.string().optional(),
  license_issue_date: z.string().optional(),
  license_issue_place: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  client?: Client | null;
}

const DOC_ACCEPT = { 'image/jpeg': [], 'image/png': [], 'application/pdf': ['.pdf'] };
const DOC_MAX = 5 * 1024 * 1024;

function dateToStr(d: Date | undefined) {
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

function strToDate(s: string | null | undefined) {
  if (!s) return undefined;
  try { return parseISO(s); } catch { return undefined; }
}

function DocPreview({
  url, label, onDelete, isDeleting,
}: {
  url: string;
  label: string;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('/pdf');

  return (
    <div className="rounded-md border overflow-hidden mb-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted">
        <p className="text-xs font-medium text-muted-foreground">{label} actuel</p>
        {onDelete && (
          confirming ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Supprimer ?</span>
              <Button
                type="button" size="sm" variant="destructive"
                className="h-6 text-xs px-2"
                disabled={isDeleting}
                onClick={() => { onDelete(); setConfirming(false); }}
              >
                Oui
              </Button>
              <Button
                type="button" size="sm" variant="outline"
                className="h-6 text-xs px-2"
                onClick={() => setConfirming(false)}
              >
                Non
              </Button>
            </div>
          ) : (
            <Button
              type="button" size="sm" variant="ghost"
              className="h-6 text-xs px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={isDeleting}
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />Supprimer
            </Button>
          )
        )}
      </div>
      {isPdf
        ? <iframe src={url} className="w-full h-48" title={label} />
        : <img src={url} alt={label} className="w-full max-h-48 object-contain bg-gray-50 p-2" />
      }
    </div>
  );
}

export function ClientForm({ client }: Props) {
  const router = useRouter();
  const isEdit = !!client;

  // Document files (for create: staged until after client creation)
  const [idDocFiles, setIdDocFiles] = useState<File[]>([]);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Local doc state (avoids form reset on delete)
  const [idDocUrl, setIdDocUrl] = useState<string | null>(client?.id_document ?? null);
  const [idDocMediaId, setIdDocMediaId] = useState<number | null>(client?.id_document_media_id ?? null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(client?.driving_license_doc ?? null);
  const [licenseMediaId, setLicenseMediaId] = useState<number | null>(client?.driving_license_media_id ?? null);

  // Mutations
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(client?.id ?? '');
  const uploadIdMutation = useUploadIdDocument(client?.id ?? '');
  const uploadLicenseMutation = useUploadDrivingLicense(client?.id ?? '');
  const deleteMediaMutation = useDeleteClientMedia(client?.id ?? '');

  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const agencies = agenciesRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending || uploading;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', first_name: '', last_name: '', email: '', phone: '',
      date_of_birth: '', birth_place: '', nationality: '', id_type: undefined, id_number: '',
      id_expiry_date: '', driving_license_number: '', driving_license_category: '',
      driving_license_expiry: '', license_issue_date: '', license_issue_place: '',
      address: '', city: '', country: 'Morocco', notes: '',
    },
  });

  useEffect(() => {
    setIdDocUrl(client?.id_document ?? null);
    setIdDocMediaId(client?.id_document_media_id ?? null);
    setLicenseUrl(client?.driving_license_doc ?? null);
    setLicenseMediaId(client?.driving_license_media_id ?? null);
  }, [client?.id_document, client?.id_document_media_id, client?.driving_license_doc, client?.driving_license_media_id]);

  useEffect(() => {
    if (client) {
      form.reset({
        agency_id: client.agency_id,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email ?? '',
        phone: client.phone,
        date_of_birth: client.date_of_birth ?? '',
        birth_place: client.birth_place ?? '',
        nationality: client.nationality ?? '',
        id_type: client.id_type ?? undefined,
        id_number: client.id_number ?? '',
        id_expiry_date: client.id_expiry_date ?? '',
        driving_license_number: client.driving_license_number ?? '',
        driving_license_category: client.driving_license_category ?? '',
        driving_license_expiry: client.driving_license_expiry ?? '',
        license_issue_date: client.license_issue_date ?? '',
        license_issue_place: client.license_issue_place ?? '',
        address: client.address ?? '',
        city: client.city ?? '',
        country: client.country ?? 'Morocco',
        notes: client.notes ?? '',
      });
    }
  }, [client, form]);

  const handleBackendErrors = (error: any) => {
    const data = error?.response?.data;
    if (data?.errors) {
      Object.entries(data.errors).forEach(([field, messages]) => {
        form.setError(field as keyof FormValues, {
          type: 'server',
          message: (messages as string[])[0],
        });
      });
    } else {
      toast.error(data?.message ?? 'Une erreur est survenue');
    }
  };

  const handleDeleteDoc = (type: 'id' | 'license') => () => {
    const mediaId = type === 'id' ? idDocMediaId : licenseMediaId;
    if (!mediaId) return;
    deleteMediaMutation.mutate(mediaId, {
      onSuccess: () => {
        if (type === 'id') { setIdDocUrl(null); setIdDocMediaId(null); }
        else { setLicenseUrl(null); setLicenseMediaId(null); }
        toast.success('Document supprimé');
      },
      onError: () => toast.error('Échec de la suppression'),
    });
  };

  // Upload docs immediately on edit mode
  const handleEditUpload = (type: 'id' | 'license') => async (files: File[]) => {
    if (!files[0] || !client) return;
    const mutation = type === 'id' ? uploadIdMutation : uploadLicenseMutation;
    const label = type === 'id' ? 'Pièce d\'identité' : 'Permis de conduire';
    mutation.mutate(files[0], {
      onSuccess: () => toast.success(`${label} téléversé`),
      onError: () => toast.error(`Échec du téléversement`),
    });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, email: values.email || undefined };

    if (isEdit) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => {
          toast.success('Client mis à jour');
          router.push(`/clients/${client!.id}`);
        },
        onError: handleBackendErrors,
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: async (res) => {
          const newId = (res as any)?.data?.id;
          if (newId && (idDocFiles[0] || licenseFiles[0])) {
            setUploading(true);
            try {
              if (idDocFiles[0]) await clientService.uploadIdDocument(newId, idDocFiles[0]);
              if (licenseFiles[0]) await clientService.uploadDrivingLicense(newId, licenseFiles[0]);
            } catch {
              toast.error('Client créé mais l\'upload de documents a échoué');
            } finally {
              setUploading(false);
            }
          }
          toast.success('Client créé');
          router.push(newId ? `/clients/${newId}` : '/clients');
        },
        onError: handleBackendErrors,
      });
    }
  };

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col p-6 mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={client ? `/clients/${client.id}` : '/clients'}>
              <IconArrowLeft className="h-4 w-4 mr-1" />Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Modifier le client' : 'Ajouter un client'}</h1>
            <p className="text-muted-foreground text-sm">
              {isEdit ? 'Mettre à jour les informations du client' : 'Enregistrer un nouveau client dans la base de données'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Agence */}
            <Card>
              <CardHeader><CardTitle className="text-base">Agence</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agencies.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Informations personnelles */}
            <Card>
              <CardHeader><CardTitle className="text-base">Informations personnelles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Mohamed" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Alami" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={strToDate(field.value)}
                          setDate={(d) => field.onChange(dateToStr(d))}
                          placeholder="Sélectionner une date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="birth_place" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de naissance</FormLabel>
                      <FormControl><Input placeholder="Casablanca" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationalité</FormLabel>
                      <FormControl><Input placeholder="Marocaine" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Pièce d'identité */}
            <Card>
              <CardHeader><CardTitle className="text-base">Pièce d&apos;identité</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="id_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de pièce</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cin">CIN</SelectItem>
                          <SelectItem value="passport">Passeport</SelectItem>
                          <SelectItem value="residence_permit">Titre de séjour</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="id_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro</FormLabel>
                      <FormControl><Input placeholder="AB123456" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="id_expiry_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;expiration</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={strToDate(field.value)}
                          setDate={(d) => field.onChange(dateToStr(d))}
                          placeholder="Sélectionner"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Document upload — CIN / Passeport */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    Scan CIN / Passeport
                    {isEdit && uploadIdMutation.isPending && <span className="text-xs text-muted-foreground ml-1">Téléversement…</span>}
                  </p>
                  {isEdit && idDocUrl && (
                    <DocPreview
                      url={idDocUrl}
                      label="CIN / Passeport"
                      onDelete={handleDeleteDoc('id')}
                      isDeleting={deleteMediaMutation.isPending}
                    />
                  )}
                  <FileUploader
                    value={isEdit ? [] : idDocFiles}
                    onValueChange={isEdit ? undefined : setIdDocFiles}
                    onUpload={isEdit ? handleEditUpload('id') : undefined}
                    accept={DOC_ACCEPT}
                    maxSize={DOC_MAX}
                    maxFiles={1}
                    disabled={isEdit && (uploadIdMutation.isPending || deleteMediaMutation.isPending)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG ou PDF — max 5 Mo</p>
                </div>
              </CardContent>
            </Card>

            {/* Permis de conduire */}
            <Card>
              <CardHeader><CardTitle className="text-base">Permis de conduire</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="driving_license_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° de permis</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="driving_license_category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <FormControl><Input placeholder="B" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="driving_license_expiry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;expiration</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={strToDate(field.value)}
                          setDate={(d) => field.onChange(dateToStr(d))}
                          placeholder="Sélectionner"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="license_issue_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de délivrance</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={strToDate(field.value)}
                          setDate={(d) => field.onChange(dateToStr(d))}
                          placeholder="Sélectionner"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="license_issue_place" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de délivrance</FormLabel>
                      <FormControl><Input placeholder="Larache" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Document upload — Permis */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    Scan permis de conduire
                    {isEdit && uploadLicenseMutation.isPending && <span className="text-xs text-muted-foreground ml-1">Téléversement…</span>}
                  </p>
                  {isEdit && licenseUrl && (
                    <DocPreview
                      url={licenseUrl}
                      label="Permis de conduire"
                      onDelete={handleDeleteDoc('license')}
                      isDeleting={deleteMediaMutation.isPending}
                    />
                  )}
                  <FileUploader
                    value={isEdit ? [] : licenseFiles}
                    onValueChange={isEdit ? undefined : setLicenseFiles}
                    onUpload={isEdit ? handleEditUpload('license') : undefined}
                    accept={DOC_ACCEPT}
                    maxSize={DOC_MAX}
                    maxFiles={1}
                    disabled={isEdit && (uploadLicenseMutation.isPending || deleteMediaMutation.isPending)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG ou PDF — max 5 Mo</p>
                </div>
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader><CardTitle className="text-base">Adresse</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl><Input placeholder="123 Rue Hassan II" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl><Input placeholder="Casablanca" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl><Input placeholder="Morocco" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Remarques */}
            <Card>
              <CardHeader><CardTitle className="text-base">Remarques</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea placeholder="Informations complémentaires…" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pb-6">
              <Button type="button" variant="outline" asChild>
                <Link href={client ? `/clients/${client.id}` : '/clients'}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le client'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
}
