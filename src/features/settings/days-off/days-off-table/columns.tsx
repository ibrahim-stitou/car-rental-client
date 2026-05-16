'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Repeat, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format';
import { Country, DayOff } from '@/features/settings/days-off/types';
import { useLanguage } from '@/context/LanguageContext';

export const daysOffColumns = ({
                                 onOpenModal,
                                 onEdit,
                               }: {
  onOpenModal: (id: number) => void;
  onEdit: (dayOff: DayOff) => void;
}): ColumnDef<DayOff>[] => {
  //@ts-ignore
  const { t } = useLanguage();

  return [
    {
      accessorKey: 'rowNumber',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.number')}</div>,
      cell: ({ row }) => {
        // Sequential numbering
        return <div className="font-medium text-center">{row.index + 1}</div>;
      },
    },
    {
      accessorKey: 'name',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.name')}</div>,
      cell: ({ row }) => <div className="font-medium text-center">{row.original.name}</div>,
    },
    {
      accessorKey: 'countryId',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.country')}</div>,
      cell: ({ row, table }) => {
        const countries = (table.options.meta as any)?.countries || [];
        // Convert both to strings for comparison
        const country = countries.find((c: Country) =>
          String(c.id) === String(row.original.countryId)
        );
        return <div className="text-center">{country?.nom || t('admin.settings.daysOff.labels.unknown')}</div>;
      },
    },
    {
      accessorKey: 'dateStart',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.date')}</div>,
      cell: ({ row }) => {
        const startDate = new Date(row.original.dateStart);
        const endDate = new Date(row.original.dateEnd);
        const isSameDay = startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];
        const isRecurring = row.original.isRecurring;

        // Different format for recurring days (without year)
        const formatRecurringDate = (date: string | Date) => {
          const d = new Date(date);
          // Format: "DD Month" (ex: "25 December")
          return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' })}`;
        };

        if (isRecurring) {
          if (isSameDay) {
            return <div className="text-center">{formatRecurringDate(row.original.dateStart)}</div>;
          } else {
            return (
              <div className="text-center">
                {formatRecurringDate(row.original.dateStart)} - {formatRecurringDate(row.original.dateEnd)}
              </div>
            );
          }
        } else {
          // For non-recurring, keep the full format with the year
          if (isSameDay) {
            return <div className="text-center">{formatDate(row.original.dateStart)}</div>;
          } else {
            return (
              <div className="text-center">
                {formatDate(row.original.dateStart)} - {formatDate(row.original.dateEnd)}
              </div>
            );
          }
        }
      },
    },
    {
      accessorKey: 'isRecurring',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.type')}</div>,
      cell: ({ row }) => {
        const isRecurring = row.original.isRecurring;
        const startDate = new Date(row.original.dateStart);
        const endDate = new Date(row.original.dateEnd);
        const isSameDay = startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];

        return (
          <div className="flex justify-center gap-1">
            {isRecurring && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Repeat className="h-3 w-3 mr-1" /> {t('admin.settings.daysOff.labels.recurring')}
              </Badge>
            )}
            {!isSameDay && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <CalendarDays className="h-3 w-3 mr-1" /> {t('admin.settings.daysOff.labels.multiDay')}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">{t('admin.settings.daysOff.columns.actions')}</div>,
      cell: ({ row }) => {
        const dayOff = row.original;

        return (
          <div className="flex justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="bg-green-100 text-green-600 hover:bg-green-200 p-1.5 h-8 w-8"
                  onClick={() => onEdit(dayOff)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-green-100 text-green-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.settings.daysOff.actions.editHoliday')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-100 text-red-600 hover:bg-red-200 p-1.5 h-8 w-8"
                  onClick={() => onOpenModal(dayOff.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-red-100 text-red-600 rounded-md px-2 py-1 shadow-md tooltip-content"
                sideOffset={5}
              >
                {t('admin.settings.daysOff.actions.deleteHoliday')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
};
