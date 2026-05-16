'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Expense } from '@/features/settings/expense/types';
import { useLanguage } from '@/context/LanguageContext';

export const expenseColumns = ({
                                 onOpenModal,
                                 onEdit,
                               }: {
  onOpenModal: (id: number) => void;
  onEdit: (id: number) => void;
}): ColumnDef<Expense>[] => {
  //@ts-ignore
  const { t } = useLanguage();

  return [
    {
      accessorKey: 'id',
      header: () => <div className="text-center">{t('admin.settings.expenses.table.number')}</div>,
      cell: ({ row }) => {
        const rowIndex = row.index + 1;
        return <div className="font-medium text-center">{rowIndex}</div>;
      },
    },
    {
      accessorKey: 'title',
      header: () => <div className="text-center">{t('admin.settings.expenses.table.title')}</div>,
      cell: ({ row }) => <div className="font-medium text-center">{row.original.title}</div>,
    },
    {
      accessorKey: 'description',
      header: () => <div className="text-center">{t('admin.settings.expenses.table.observation')}</div>,
      cell: ({ row }) => <div className="text-center">{row.original.description || '-'}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center">{t('admin.settings.expenses.table.actions')}</div>,
      cell: ({ row }) => {
        const expense = row.original;

        return (
          <div className="flex justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="bg-green-100 text-green-600 hover:bg-green-200 p-1.5 h-8 w-8"
                  onClick={() => onEdit(expense.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-green-100 text-green-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.settings.expenses.actions.edit')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                  onClick={() => onOpenModal(expense.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.settings.expenses.actions.delete')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ]
};