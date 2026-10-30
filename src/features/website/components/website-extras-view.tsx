'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomAlertDialog from '@/components/custom/customAlert';
import { PageHeader } from '@/components/shared/page-header';
import type { ExtraPricing, WebsiteExtra, WebsiteExtraInput } from '@/types/website.types';
import { useDeleteWebsiteExtra, useSaveWebsiteExtra, useWebsiteExtras } from '../hooks/use-website';
import { EXTRA_PRICING } from '../constants';
import { cleanTranslatable, formatMad, frText, toastWebsiteError } from '../utils';
import { TranslatableField } from './translatable-field';

type Draft = WebsiteExtraInput & { id?: string };

const EMPTY: Draft = { code: '', label: {}, description: {}, pricing: 'per_day', price: 0, max_quantity: 1, is_active: true, sort_order: 0 };

export function WebsiteExtrasView() {
  const { data: res, isLoading } = useWebsiteExtras();
  const extras = res?.data ?? [];
  const saveMutation = useSaveWebsiteExtra();
  const deleteMutation = useDeleteWebsiteExtra();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const edit = (e: WebsiteExtra) => setDraft({
    id: e.id, code: e.code, label: e.label, description: e.description ?? {}, pricing: e.pricing,
    price: Number(e.price), max_quantity: e.max_quantity, is_active: e.is_active, sort_order: e.sort_order,
  });

  const handleSave = () => {
    if (!draft) return;
    const { id, code, ...rest } = draft;
    const data: WebsiteExtraInput = {
      ...rest,
      ...(id ? {} : { code }),
      label: cleanTranslatable(draft.label),
      description: cleanTranslatable(draft.description),
    };
    saveMutation.mutate({ id, data }, {
      onSuccess: (r) => { toast.success(r.message); setDraft(null); },
      onError: (err) => toastWebsiteError(err, 'Enregistrement impossible'),
    });
  };

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Options de location"
        description="Équipements et services que le client peut ajouter à sa demande (siège bébé, conducteur additionnel…)"
        onAdd={() => setDraft({ ...EMPTY })}
        addLabel="Nouvelle option"
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : extras.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucune option pour l&apos;instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Quantité max</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {extras.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{frText(e.label)}</div>
                      {frText(e.description) && <div className="text-xs text-muted-foreground line-clamp-1">{frText(e.description)}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.code}</TableCell>
                    <TableCell className="text-sm">
                      {formatMad(e.price)} <span className="text-xs text-muted-foreground">{e.pricing === 'per_day' ? '/ jour' : '/ location'}</span>
                    </TableCell>
                    <TableCell className="text-sm">{e.max_quantity ?? 1}</TableCell>
                    <TableCell>
                      {e.is_active
                        ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Proposée</Badge>
                        : <Badge variant="outline" className="text-xs">Masquée</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => edit(e)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) setDraft(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Modifier l'option" : 'Nouvelle option'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <TranslatableField label="Libellé" value={draft.label} onChange={(label) => set({ label })} maxLength={100} required={['fr']} />
              <TranslatableField label="Description" value={draft.description} onChange={(description) => set({ description })} multiline rows={2} maxLength={500} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Code technique</Label>
                  <Input value={draft.code ?? ''} disabled={!!draft.id} placeholder="baby_seat" className="font-mono"
                    onChange={(e) => set({ code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tarification</Label>
                  <Select value={draft.pricing} onValueChange={(v) => set({ pricing: v as ExtraPricing })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXTRA_PRICING.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prix (MAD)</Label>
                  <Input type="number" min={0} step="0.01" value={draft.price} onChange={(e) => set({ price: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quantité max</Label>
                  <Input type="number" min={1} max={10} value={draft.max_quantity ?? 1} onChange={(e) => set({ max_quantity: Number(e.target.value) || 1 })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ordre</Label>
                  <Input type="number" min={0} value={draft.sort_order ?? 0} onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })} />
                </div>
                <label className="flex items-end justify-between gap-2 pb-2 text-sm">
                  Proposée sur le site
                  <Switch checked={draft.is_active ?? true} onCheckedChange={(c) => set({ is_active: c })} />
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !draft?.label.fr?.trim() || (!draft?.id && !draft?.code)}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog
        title="Supprimer cette option ?"
        description="Elle ne sera plus proposée. Les demandes déjà reçues la conservent."
        confirmText="Supprimer"
        cancelText="Annuler"
        open={deleteId !== null}
        setOpen={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => toast.success('Option supprimée'),
            onError: (err) => toastWebsiteError(err, 'Suppression impossible'),
          });
          setDeleteId(null);
        }}
      />
    </div>
  );
}
