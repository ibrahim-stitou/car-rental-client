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

export function ProfileView() {
  const { data: session, update } = useSession();
  const sessionUser = session?.user as any;
  const qc = useQueryClient();

  const { data: profileData, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get(apiRoutes.profile.show).then(r => r.data?.data),
  });

  const user = profileData ?? sessionUser;

  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [deletingSignature, setDeletingSignature] = useState(false);
  const [deletingStamp, setDeletingStamp] = useState(false);

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

  const uploadSignature = async (file: File) => {
    setUploadingSignature(true);
    try {
      const fd = new FormData();
      fd.append('signature', file);
      await apiClient.post(apiRoutes.profile.uploadSignature, fd);
      toast.success('Signature enregistrée');
      refetch();
    } catch { toast.error('Erreur upload signature'); }
    finally { setUploadingSignature(false); }
  };

  const deleteSignature = async () => {
    setDeletingSignature(true);
    try {
      await apiClient.delete(apiRoutes.profile.deleteSignature);
      toast.success('Signature supprimée');
      refetch();
    } catch { toast.error('Erreur suppression'); }
    finally { setDeletingSignature(false); }
  };

  const uploadStamp = async (file: File) => {
    setUploadingStamp(true);
    try {
      const fd = new FormData();
      fd.append('stamp', file);
      await apiClient.post(apiRoutes.profile.uploadStamp, fd);
      toast.success('Cachet enregistré');
      refetch();
    } catch { toast.error('Erreur upload cachet'); }
    finally { setUploadingStamp(false); }
  };

  const deleteStamp = async () => {
    setDeletingStamp(true);
    try {
      await apiClient.delete(apiRoutes.profile.deleteStamp);
      toast.success('Cachet supprimé');
      refetch();
    } catch { toast.error('Erreur suppression'); }
    finally { setDeletingStamp(false); }
  };

  if (!user) return null;

  const initials = `${(user.first_name ?? user.firstName ?? '')[0] ?? ''}${(user.last_name ?? user.lastName ?? '')[0] ?? ''}`.toUpperCase();
  const signatureUrl = user.signature ?? null;
  const stampUrl     = user.stamp ?? null;
  const hasSignature = !!signatureUrl;
  const hasStamp     = !!stampUrl;

  return (
    <PageContainer>
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos informations et votre signature pour les contrats</p>
      </div>

      {/* Signature/Stamp missing alert */}
      {(!hasSignature || !hasStamp) && (
        <Alert className="border-amber-300 bg-amber-50">
          <IconAlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            {!hasSignature && !hasStamp
              ? 'Votre signature et cachet ne sont pas encore configurés. Ils sont requis sur les contrats de location.'
              : !hasSignature
              ? 'Votre signature n\'est pas encore configurée. Elle apparaîtra sur les contrats de location.'
              : 'Votre cachet n\'est pas encore configuré. Il apparaîtra sur les contrats de location.'}
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

      {/* Signature & Stamp */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signature & Cachet</CardTitle>
          <CardDescription>
            Ces images sont automatiquement apposées sur les contrats de location que vous validez.
            Utilisez un fond blanc et une image de bonne qualité.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <ImageUploadBox
              label="Signature"
              description="Image PNG/JPG avec fond transparent ou blanc"
              imageUrl={signatureUrl}
              onUpload={uploadSignature}
              onDelete={deleteSignature}
              uploading={uploadingSignature}
              deleting={deletingSignature}
            />
            <ImageUploadBox
              label="Cachet / Tampon"
              description="Cachet officiel de l'agent ou de l'agence"
              imageUrl={stampUrl}
              onUpload={uploadStamp}
              onDelete={deleteStamp}
              uploading={uploadingStamp}
              deleting={deletingStamp}
            />
          </div>
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}
