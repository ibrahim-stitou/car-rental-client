'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomAlertDialog from '@/components/custom/customAlert';
import type { PickupPoint, PickupPointInput, PickupPointType, Translatable } from '@/types/website.types';
import { useDeletePickupPoint, useSavePickupPoint } from '../hooks/use-website';
import { PICKUP_POINT_TYPES } from '../constants';
import { cleanTranslatable, frText, toastWebsiteError } from '../utils';
import { TranslatableField } from './translatable-field';

const EMPTY: PickupPointInput = { name: {}, type: 'airport', address: '', is_active: true, sort_order: 0 };

export function PickupPointsCard({ agencyId, points }: { agencyId: string; points: PickupPoint[] }) {
  const [editing, setEditing] = useState<{ id?: string; data: PickupPointInput } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const saveMutation = useSavePickupPoint(agencyId);
  const deleteMutation = useDeletePickupPoint(agencyId);

  const typeLabel = (t: PickupPointType) => PICKUP_POINT_TYPES.find((x) => x.value === t)?.label ?? t;

  const handleSave = () => {
    if (!editing) return;
    if (!editing.data.name.fr?.trim()) { toast.error('Le nom en français est obligatoire.'); return; }
    saveMutation.mutate(
      { pointId: editing.id, data: { ...editing.data, name: cleanTranslatable(editing.data.name), address: editing.data.address || null } },
      {
        onSuccess: (r) => { toast.success(r.message); setEditing(null); },
        onError: (err) => toastWebsiteError(err, 'Enregistrement impossible'),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Points de livraison</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing({ data: { ...EMPTY } })}>
            <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Lieux proposés au client pour la remise du véhicule (aéroport, gare, hôtels…). Des frais peuvent s&apos;appliquer.
        </p>
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun point de livraison.</p>
        ) : (
          <ul className="divide-y">
            {points.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{frText(p.name)}</div>
                    <div className="text-xs text-muted-foreground truncate">{typeLabel(p.type)}{p.address && ` · ${p.address}`}</div>
                  </div>
                  {!p.is_active && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                    onClick={() => setEditing({ id: p.id, data: { name: p.name, type: p.type, address: p.address ?? '', is_active: p.is_active, sort_order: p.sort_order ?? 0, latitude: p.latitude, longitude: p.longitude } })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? 'Modifier le point de livraison' : 'Nouveau point de livraison'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <TranslatableField label="Nom" value={editing.data.name} required={['fr']}
                onChange={(name: Translatable) => setEditing({ ...editing, data: { ...editing.data, name } })} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={editing.data.type} onValueChange={(type) => setEditing({ ...editing, data: { ...editing.data, type: type as PickupPointType } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PICKUP_POINT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ordre</Label>
                  <Input inputMode="numeric" value={editing.data.sort_order ?? ''}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, sort_order: e.target.value === '' ? null : Number(e.target.value) || 0 } })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={editing.data.address ?? ''} maxLength={255}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, address: e.target.value } })} />
              </div>
              <label className="flex items-center justify-between text-sm">
                Proposé sur le site
                <Switch checked={editing.data.is_active ?? true} onCheckedChange={(c) => setEditing({ ...editing, data: { ...editing.data, is_active: c } })} />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomAlertDialog
        title="Supprimer ce point de livraison ?"
        description="Il ne sera plus proposé sur le site."
        confirmText="Supprimer"
        cancelText="Annuler"
        open={deleteId !== null}
        setOpen={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => toast.success('Point de livraison supprimé'),
            onError: (err) => toastWebsiteError(err, 'Suppression impossible'),
          });
          setDeleteId(null);
        }}
      />
    </Card>
  );
}
