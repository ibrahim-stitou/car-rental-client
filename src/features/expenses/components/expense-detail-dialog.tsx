'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DocumentsSection } from '@/components/shared/documents-section';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit } from 'lucide-react';
import {
  IconReceipt, IconCalendar, IconBuildingStore, IconCar,
  IconCurrencyDirham, IconUser,
} from '@tabler/icons-react';
import type { Expense } from '@/types/expense.types';
import type { MediaItem } from '@/types/claim.types';

const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'Carburant', maintenance: 'Maintenance', insurance: 'Assurance',
  vignette: 'Vignette', inspection: 'Contrôle technique', repair: 'Réparation',
  cleaning: 'Nettoyage', administrative: 'Administratif', salary: 'Salaire',
  rent: 'Loyer', utilities: 'Charges', other: 'Autre',
};
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', card: 'Carte bancaire', bank_transfer: 'Virement',
  check: 'Chèque', online: 'En ligne',
};

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMMM yyyy', { locale: fr }); } catch { return d; }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDocumentChange?: () => void;
}

export function ExpenseDetailDialog({ open, onOpenChange, expense, onEdit, onDocumentChange }: Props) {
  const [receipts, setReceipts] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<MediaItem[]>([]);

  const { data: mediaData, refetch: refetchMedia } = useQuery({
    queryKey: ['expense-media', expense.id],
    queryFn: () => apiClient.get(apiRoutes.expenses.media(expense.id)).then(r => r.data?.data),
    enabled: open,
  });

  useEffect(() => {
    if (mediaData) {
      setReceipts(mediaData.receipts ?? []);
      setDocuments(mediaData.documents ?? []);
    }
  }, [mediaData]);

  const handleMediaChange = () => {
    refetchMedia();
    onDocumentChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2">
              <IconReceipt className="h-5 w-5 text-slate-500" />
              Détail de la dépense
            </DialogTitle>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(expense); }}>
                <Edit className="h-3.5 w-3.5 mr-1" />Modifier
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{expense.title}</h3>
              <Badge variant="outline" className="mt-1 text-xs">
                {CATEGORY_LABELS[expense.category] ?? expense.category}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{fmt(expense.amount)} MAD</div>
              {expense.payment_method && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{fdate(expense.expense_date)}</p>
              </div>
            </div>

            {expense.vehicle && (
              <div className="flex items-center gap-2">
                <IconCar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Véhicule</p>
                  <p className="font-medium">{(expense.vehicle as any).brand} {(expense.vehicle as any).model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{(expense.vehicle as any).registration_number}</p>
                </div>
              </div>
            )}

            {expense.agency && (
              <div className="flex items-center gap-2">
                <IconBuildingStore className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Agence</p>
                  <p className="font-medium">{expense.agency.name}</p>
                </div>
              </div>
            )}

            {expense.reference && (
              <div className="flex items-center gap-2">
                <IconReceipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Référence</p>
                  <p className="font-medium font-mono">{expense.reference}</p>
                </div>
              </div>
            )}

            {expense.recorder && (
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Enregistré par</p>
                  <p className="font-medium">{(expense.recorder as any).full_name ?? (expense.recorder as any).first_name}</p>
                </div>
              </div>
            )}
          </div>

          {expense.notes && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p>{expense.notes}</p>
            </div>
          )}

          <Separator />

          {/* Documents & Receipts */}
          <div className="space-y-3">
            <DocumentsSection
              title="Justificatifs (factures, reçus)"
              entityId={expense.id}
              uploadUrl={apiRoutes.expenses.uploadReceipts(expense.id)}
              deleteUrlFn={(mid) => apiRoutes.expenses.deleteMedia(expense.id, mid)}
              initialDocuments={receipts}
              accept="image/jpeg,image/png,application/pdf"
              onRefresh={handleMediaChange}
              compact
            />
            <DocumentsSection
              title="Documents complémentaires"
              entityId={expense.id}
              uploadUrl={apiRoutes.expenses.uploadDocuments(expense.id)}
              deleteUrlFn={(mid) => apiRoutes.expenses.deleteMedia(expense.id, mid)}
              initialDocuments={documents}
              onRefresh={handleMediaChange}
              compact
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
