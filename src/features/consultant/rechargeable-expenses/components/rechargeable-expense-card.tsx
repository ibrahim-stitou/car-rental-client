import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconEdit, IconTrash } from '@tabler/icons-react';

export interface RechargeableExpenseItem {
  id: number;
  date: string;
  nature: string;
  amount: number;
  commentaire?: string;
}

interface RechargeableExpenseCardProps {
  expense: RechargeableExpenseItem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => Promise<void>;
}

export default function RechargeableExpenseCard({
                                                  expense,
                                                  onEdit,
                                                  onDelete,
                                                }: RechargeableExpenseCardProps) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <strong>Date:</strong> {format(new Date(expense.date), 'PPP')}
          </div>
          <div>
            <strong>Nature:</strong> {expense.nature}
          </div>
          <div>
            <strong>Amount:</strong> €{expense.amount.toFixed(2)}
          </div>
          {expense.commentaire && (
            <div>
              <strong>Commentaire:</strong> {expense.commentaire}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(expense.id)}>
              <IconEdit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500"
              onClick={() => onDelete(expense.id)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}