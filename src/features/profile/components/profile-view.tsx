'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconPencil, IconTrash, IconUpload, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name:  z.string().min(1, 'Nom requis'),
  phone:      z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function ImageUploadBox({
  label, description, imageUrl, onUpload, onDelete, uploading, deleting,
}: {
  label: string; description: string; imageUrl?: string | null;
  onUpload: (file: File) => void; onDelete: () => void;
  uploading: boolean; deleting: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="relative border-2 border-dashed rounded-xl overflow-hidden bg-muted/20 aspect-[3/1] flex items-center justify-center group">
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label} className="max-h-full max-w-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()} disabled={uploading}>
                <IconPencil className="h-3.5 w-3.5 mr-1" />Remplacer
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={deleting}>
                <IconTrash className="h-3.5 w-3.5 mr-1" />Supprimer
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center cursor-pointer p-4" onClick={() => ref.current?.click()}>
            <IconUpload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Cliquer pour téléverser</p>
          </div>
        )}
        <input
          ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
        />
      </div>
      {imageUrl && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <IconCheck className="h-3 w-3" />{label} enregistrée
        </div>
      )}
    </div>
  );
}

type AssetType = 'signature' | 'stamp';

export function ProfileView() {
  const { data: session, update } = useSession();
  const sessionUser = session?.user as any;
  const qc = useQueryClient();

  const { data: profileData, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get(apiRoutes.profile.show).then(r => r.data?.data),
  });

  const user = profileData ?? sessionUser;
  const agencies: { id: string; name: string; stamp_url?: string | null; signature_url?: string | null }[] = user?.agencies ?? [];

  // Tracks which (agencyId, assetType) upload/delete is currently in flight.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const pendingKey = (agencyId: string, type: AssetType, action: 'upload' | 'delete') => `${agencyId}:${type}:${action}`;
  const setPendingState = (key: string, value: boolean) => setPending((p) => ({ ...p, [key]: value }));

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name ?? user.firstName ?? '',
        last_name:  user.last_name  ?? user.lastName  ?? '',
        phone:      user.phone ?? '',
      });
    }
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    try {
      await apiClient.put(apiRoutes.profile.update, values);
      toast.success('Profil mis à jour');
      await update();
      refetch();
    } catch {
      toast.error('Échec de la mise à jour');
    }
  };

  const uploadAsset = async (agencyId: string, type: AssetType, file: File) => {
    const key = pendingKey(agencyId, type, 'upload');
    setPendingState(key, true);
    try {
      const fd = new FormData();
      fd.append(type, file);
      fd.append('agency_id', agencyId);
      const route = type === 'signature' ? apiRoutes.profile.uploadSignature : apiRoutes.profile.uploadStamp;
      await apiClient.post(route, fd);
      toast.success(type === 'signature' ? 'Signature enregistrée' : 'Cachet enregistré');
      refetch();
    } catch {
      toast.error(`Erreur upload ${type === 'signature' ? 'signature' : 'cachet'}`);
    } finally {
      setPendingState(key, false);
    }
  };

  const deleteAsset = async (agencyId: string, type: AssetType) => {
    const key = pendingKey(agencyId, type, 'delete');
    setPendingState(key, true);
    try {
      const route = type === 'signature' ? apiRoutes.profile.deleteSignature : apiRoutes.profile.deleteStamp;
      await apiClient.delete(route, { data: { agency_id: agencyId } });
      toast.success(type === 'signature' ? 'Signature supprimée' : 'Cachet supprimé');
      refetch();
    } catch {
      toast.error('Erreur suppression');
    } finally {
      setPendingState(key, false);
    }
  };

  if (!user) return null;

  const initials = `${(user.first_name ?? user.firstName ?? '')[0] ?? ''}${(user.last_name ?? user.lastName ?? '')[0] ?? ''}`.toUpperCase();
  const agenciesMissingAssets = agencies.filter((a) => !a.signature_url || !a.stamp_url);

  return (
    <PageContainer>
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos informations et votre signature pour les contrats</p>
      </div>

      {/* Signature/Stamp missing alert */}
      {agenciesMissingAssets.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50">
          <IconAlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Signature et/ou cachet manquants pour : {agenciesMissingAssets.map((a) => a.name).join(', ')}.
            Un cachet est requis par agence pour apparaître sur les contrats de location de cette agence.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar ?? user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.first_name ?? user.firstName} {user.last_name ?? user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-1">
                {((user.roles as string[] | undefined) ?? []).map((r: string) => (
                  <Badge key={r} variant="outline" className="text-xs capitalize">{r.replace(/-/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>Prénom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={user.email ?? ''} disabled className="bg-muted" />
              </FormItem>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Signature & Stamp — one per agency */}
      {agencies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signature & Cachet</CardTitle>
            <CardDescription>Vous n'êtes rattaché à aucune agence pour le moment.</CardDescription>
          </CardHeader>
        </Card>
      ) : agencies.map((agency) => (
        <Card key={agency.id}>
          <CardHeader>
            <CardTitle className="text-base">Signature & Cachet — {agency.name}</CardTitle>
            <CardDescription>
              Ces images sont automatiquement apposées sur les contrats de location de cette agence que vous validez.
              Utilisez un fond blanc et une image de bonne qualité.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <ImageUploadBox
                label="Signature"
                description="Image PNG/JPG avec fond transparent ou blanc"
                imageUrl={agency.signature_url}
                onUpload={(file) => uploadAsset(agency.id, 'signature', file)}
                onDelete={() => deleteAsset(agency.id, 'signature')}
                uploading={!!pending[pendingKey(agency.id, 'signature', 'upload')]}
                deleting={!!pending[pendingKey(agency.id, 'signature', 'delete')]}
              />
              <ImageUploadBox
                label="Cachet / Tampon"
                description="Cachet officiel de l'agent ou de l'agence"
                imageUrl={agency.stamp_url}
                onUpload={(file) => uploadAsset(agency.id, 'stamp', file)}
                onDelete={() => deleteAsset(agency.id, 'stamp')}
                uploading={!!pending[pendingKey(agency.id, 'stamp', 'upload')]}
                deleting={!!pending[pendingKey(agency.id, 'stamp', 'delete')]}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    </PageContainer>
  );
}
