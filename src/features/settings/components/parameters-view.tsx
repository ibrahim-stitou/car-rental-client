'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { applyServerErrors } from '@/lib/form-errors';
import {
  useParameters, useCreateParameter, useUpdateParameter, useDeleteParameter,
} from '../hooks/use-parameters';
import type { Parameter, ParameterCategory } from '@/types/parameter.types';

const CATEGORIES: { key: ParameterCategory; label: string; description: string }[] = [
  { key: 'insurance_type', label: "Types d'assurance", description: 'Types de police utilisés lors de la création des assurances' },
  { key: 'insurance_company', label: "Compagnies d'assurance", description: "Compagnies d'assurance disponibles dans les formulaires" },
  { key: 'inspection_center', label: 'Centres de visite technique', description: 'Centres de contrôle technique suggérés' },
  { key: 'expense_category', label: 'Catégories de dépense', description: 'Catégories utilisées pour classer les dépenses' },
  { key: 'accident_type', label: "Types d'accident", description: 'Types de sinistre utilisés lors de la déclaration des accidents' },
  { key: 'maintenance_type', label: 'Types de maintenance', description: 'Types utilisés lors de la création des maintenances' },
  { key: 'maintenance_sub_type', label: 'Sous-types de maintenance', description: 'Sous-catégories détaillées des interventions de maintenance' },
];

const schema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  value: z.string().min(1, 'Valeur requise'),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function slugify(s: string) {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function CategoryTable({ category }: { category: ParameterCategory }) {
  const { data, isLoading } = useParameters({ category });
  const createMutation = useCreateParameter();
  const [editing, setEditing] = useState<Parameter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Parameter | null>(null);

  const params = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{CATEGORIES.find(c => c.key === category)?.label}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{CATEGORIES.find(c => c.key === category)?.description}</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Ajouter
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : params.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun élément — cliquez sur « Ajouter » pour en créer un.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead className="w-24">Actif</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {params.map((p) => (
                <ParameterRow key={p.id} parameter={p} onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => setDeleteTarget(p)} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ParameterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={category}
        parameter={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Si ce paramètre est déjà utilisé par des enregistrements existants, la suppression sera refusée — désactivez-le plutôt dans ce cas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <DeleteConfirmAction target={deleteTarget} onDone={() => setDeleteTarget(null)} />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ParameterRow({ parameter, onEdit, onDelete }: { parameter: Parameter; onEdit: () => void; onDelete: () => void }) {
  const updateMutation = useUpdateParameter(parameter.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{parameter.label}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{parameter.value}</TableCell>
      <TableCell>
        <Switch
          checked={parameter.is_active}
          disabled={updateMutation.isPending}
          onCheckedChange={(checked) => updateMutation.mutate({ is_active: checked }, {
            onSuccess: () => toast.success(checked ? 'Activé' : 'Désactivé'),
            onError: () => toast.error('Échec de la mise à jour'),
          })}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </TableCell>
    </TableRow>
  );
}

function DeleteConfirmAction({ target, onDone }: { target: Parameter | null; onDone: () => void }) {
  const deleteMutation = useDeleteParameter();
  return (
    <AlertDialogAction
      className="bg-red-600 hover:bg-red-700"
      disabled={deleteMutation.isPending}
      onClick={(e) => {
        e.preventDefault();
        if (!target) return;
        deleteMutation.mutate(target.id, {
          onSuccess: () => { toast.success('Paramètre supprimé'); onDone(); },
          onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Suppression impossible'); onDone(); },
        });
      }}
    >
      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
    </AlertDialogAction>
  );
}

function ParameterFormDialog({
  open, onOpenChange, category, parameter,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; category: ParameterCategory; parameter: Parameter | null;
}) {
  const createMutation = useCreateParameter();
  const updateMutation = useUpdateParameter(parameter?.id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: parameter
      ? { label: parameter.label, value: parameter.value, is_active: parameter.is_active }
      : { label: '', value: '', is_active: true },
  });

  const onSubmit = (values: FormValues) => {
    if (parameter) {
      updateMutation.mutate(values, {
        onSuccess: () => { toast.success('Paramètre mis à jour'); onOpenChange(false); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la mise à jour'),
      });
    } else {
      createMutation.mutate({ ...values, category }, {
        onSuccess: () => { toast.success('Paramètre créé'); onOpenChange(false); form.reset({ label: '', value: '', is_active: true }); },
        onError: (err) => applyServerErrors(err, form, 'Échec de la création'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parameter ? 'Modifier le paramètre' : 'Ajouter un paramètre'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="label" render={({ field }) => (
              <FormItem>
                <FormLabel>Libellé *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ex. Wafa Assurance"
                    onChange={(e) => {
                      field.onChange(e);
                      if (!parameter && !form.formState.dirtyFields.value) {
                        form.setValue('value', slugify(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="value" render={({ field }) => (
              <FormItem>
                <FormLabel>Valeur (code interne) *</FormLabel>
                <FormControl><Input {...field} placeholder="ex. wafa_assurance" className="font-mono" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="!mt-0">Actif</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (parameter ? 'Mettre à jour' : 'Créer')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ParametersView() {
  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings"><ArrowLeft className="h-4 w-4 mr-1" />Paramètres</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paramètres métier</h1>
            <p className="text-muted-foreground text-sm">Gérez les listes utilisées dans les formulaires de l'application</p>
          </div>
        </div>

        <Tabs defaultValue="insurance_type">
          <TabsList>
            {CATEGORIES.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.key} value={c.key} className="mt-4">
              <CategoryTable category={c.key} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageContainer>
  );
}
