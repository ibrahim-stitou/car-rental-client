import { format } from 'date-fns';
import { IconCar, IconRoute, IconCalendar, IconNote, IconEdit, IconTrash, IconArrowBackUp } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

export interface MileageExpenseItem {
  id: number;
  mileage_expense_id: number;
  from_adresse: string;
  to_adresse: string;
  total_km: string | number;
  total_price: string | number;
  description?: string;
  day: string;
  created_at?: string;
  updated_at?: string;
}

interface MileageExpenseCardProps {
  expense: MileageExpenseItem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number, showNotification?: boolean) => Promise<void>;
  isBeingEdited?: boolean;
  readOnly?: boolean;
  onDuplicateReturn?: (id: number) => void;
}

export default function MileageExpenseCard({
                                             expense,
                                             onEdit,
                                             onDelete,
                                             onDuplicateReturn,
                                             isBeingEdited = false,
                                             readOnly = false,
                                           }: MileageExpenseCardProps) {
  const { t } = useLanguage();

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(numAmount);
  };

  return (
    <Card className={`border p-1 transition-colors ${isBeingEdited ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          {/* Date */}
          <div className="flex items-center text-sm">
            <IconCalendar className="mr-2 h-4 w-4 text-gray-500" />
            <span className="font-medium">{formatDate(expense.day)}</span>
          </div>

          {/* Route details */}
          <div className="flex items-start">
            <IconRoute className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col">
              <div className="font-medium">{expense.from_adresse}</div>
              <div className="text-gray-500">{t('admin.mileageExpenses.details.origin') || 'Origin'}</div>
              <div className="font-medium">{expense.to_adresse}</div>
              <div className="text-gray-500">{t('admin.mileageExpenses.details.destination') || 'Destination'}</div>
            </div>
          </div>

          {/* Description if exists */}
          {expense.description && (
            <div className="flex items-start">
              <IconNote className="mr-2 h-4 w-4 text-gray-500" />
              <div className="flex-1 text-sm text-gray-600">{expense.description}</div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex flex-col rounded-md bg-gray-50 p-2">
              <span className="text-xs text-gray-500">{t('admin.mileageExpenses.details.distanceKm') || 'Distance'}</span>
              <span className="font-medium">
                {typeof expense.total_km === 'string'
                  ? parseFloat(expense.total_km).toFixed(2)
                  : expense.total_km.toFixed(2)} km
              </span>
            </div>
            <div className="flex flex-col rounded-md bg-gray-50 p-2">
              <span className="text-xs text-gray-500">{t('admin.mileageExpenses.details.calculatedAmount') || 'Amount'}</span>
              <span className="font-medium">
                {formatCurrency(expense.total_price)}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex justify-end gap-2 pt-2">
              {onDuplicateReturn && (
                <Button
                  onClick={() => onDuplicateReturn(expense.id)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                  title={t('consultant.mileageExpenses.actions.duplicateReturn') || 'Duplicate return trip'}
                >
                  <IconArrowBackUp className="h-4 w-4 mr-1" />
                  <span className="text-xs">{t('consultant.mileageExpenses.actions.return') || 'Return'}</span>
                </Button>
              )}
              {onEdit && (
                <Button
                  onClick={() => onEdit(expense.id)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <IconEdit className="h-4 w-4" />
                  <span className="sr-only">{t('admin.mileageExpenses.actions.edit') || 'Edit'}</span>
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => onDelete(expense.id)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                  <span className="sr-only">{t('admin.mileageExpenses.actions.delete') || 'Delete'}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}