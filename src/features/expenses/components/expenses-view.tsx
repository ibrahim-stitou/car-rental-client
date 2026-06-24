'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CustomAlertDialog from '@/components/custom/customAlert';
import CustomTable from '@/components/custom/data-table/custom-table';
import type { CustomTableColumn, CustomTableFilterConfig, UseTableReturn } from '@/components/custom/data-table/types';
import { ExpenseForm } from './expense-form';
import { ExpenseDetailDialog } from './expense-detail-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';
import type { Expense } from '@/types/expense.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'Carburant', maintenance: 'Maintenance', insurance: 'Assurance',
  vignette: 'Vignette', inspection: 'Contrôle tech.', repair: 'Réparation',
  cleaning: 'Nettoyage', administrative: 'Administratif', salary: 'Salaire',
  rent: 'Loyer', utilities: 'Charges', other: 'Autre',
};
const CATEGORY_COLORS: Record<string, string> = {
  fuel: 'bg-orange-100 text-orange-800', maintenance: 'bg-blue-100 text-blue-800',
  insurance: 'bg-purple-100 text-purple-800', vignette: 'bg-green-100 text-green-800',
  inspection: 'bg-cyan-100 text-cyan-800', repair: 'bg-red-100 text-red-800',
  cleaning: 'bg-teal-100 text-teal-800', administrative: 'bg-gray-100 text-gray-800',
  salary: 'bg-yellow-100 text-yellow-800', rent: 'bg-pink-100 text-pink-800',
  utilities: 'bg-indigo-100 text-indigo-800', other: 'bg-slate-100 text-slate-800',
};

export function ExpensesView() {
  const [tableInstance, setTableInstance] = useState<Partial<UseTableReturn<Expense>> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: CustomTableColumn<Expense>[] = [
    {
      data: 'title',
      label: 'Dépense',
      sortable: true,
      render: (_v, row) => (
        <div>
          <div className="font-medium text-sm">{row.title}</div>
          {row.reference && <div className="text-xs text-muted-foreground font-mono">Réf: {row.reference}</div>}
        </div>
      ),
    },
    {
      data: 'category',
      label: 'Catégorie',
      sortable: true,
      render: (v) => (
        <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[v as string] ?? ''}`}>
          {CATEGORY_LABELS[v as string] ?? v}
        </Badge>
      ),
    },
    {
      data: 'amount',
      label: 'Montant',
      sortable: true,
      render: (v) => <span className="font-semibold text-sm">{Number(v).toLocaleString('fr-MA')} MAD</span>,
    },
    {
      data: 'expense_date',
      label: 'Date',
      sortable: true,
      render: (v) => <span className="text-sm">{v ? format(new Date(v as string), 'dd MMM yyyy', { locale: fr }) : '—'}</span>,
    },
    {
      data: 'vehicle',
      label: 'Véhicule',
      sortable: false,
      render: (_v, row) => row.vehicle
        ? <span className="text-xs font-mono">{(row.vehicle as any).registration_number}</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      data: 'agency',
      label: 'Agence',
      sortable: false,
      render: (_v, row) => <span className="text-sm">{(row.agency as any)?.name ?? '—'}</span>,
    },
    {
      data: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          {/* Voir détails + documents */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => setViewExpense(row)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voir & Documents</TooltipContent>
          </Tooltip>
          {/* Modifier */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5" onClick={() => { setEditExpense(row); setFormOpen(true); }}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier</TooltipContent>
          </Tooltip>
          {/* Supprimer */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-1.5 text-red-600 hover:bg-red-50"
                onClick={() => { setDeleteId(row.id); setOpenDeleteModal(true); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const filters: CustomTableFilterConfig[] = [
    { field: 'search', label: 'Rechercher une dépense…', type: 'text' },
    {
      field: 'category',
      label: 'Catégorie',
      type: 'select',
      options: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(apiRoutes.expenses.delete(deleteId));
      toast.success('Dépense supprimée');
      tableInstance?.refresh?.();
    } catch {
      toast.error('Impossible de supprimer la dépense');
    }
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader
        title="Dépenses"
        description="Suivi des dépenses véhicules et agences"
        onAdd={() => { setEditExpense(null); setFormOpen(true); }}
        addLabel="Nouvelle dépense"
      />

      <CustomTable<Expense>
        url={apiRoutes.expenses.list}
        columns={columns}
        filters={filters}
        onInit={(instance) => setTableInstance(instance)}
      />

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editExpense}
        onSuccess={() => tableInstance?.refresh?.()}
      />

      {viewExpense && (
        <ExpenseDetailDialog
          open={!!viewExpense}
          onOpenChange={(o) => !o && setViewExpense(null)}
          expense={viewExpense}
          onEdit={(e) => { setViewExpense(null); setEditExpense(e); setFormOpen(true); }}
          onDocumentChange={() => tableInstance?.refresh?.()}
        />
      )}

      <CustomAlertDialog
        title="Supprimer la dépense ?"
        description="Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
