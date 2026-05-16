// components/expense/expense-card.tsx
'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ExpenseItem {
  id: number;
  expense_id?: number;
  description: string;
  ammount_ttc?: number;
  amount_ttc?: number;
  amount?: number;
  day?: string;
  date?: string;
  categorie_id?: number;
  category_id?: number;
  category?: {
    id: number;
    title: string;
  };
  category_name?: string;
  receipt_path?: string;
  receipt_url?: string;
  media?: Array<{
    id: number;
    original_url: string;
    file_name: string;
    mime_type: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface ExpenseCardProps {
  expense: ExpenseItem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  isBeingEdited?: boolean;
  readOnly?: boolean;
}

export default function ExpenseCard({
                                      expense,
                                      onEdit,
                                      onDelete,
                                      isBeingEdited = false,
                                      readOnly = false
                                    }: ExpenseCardProps) {
  const { t, language } = useLanguage();
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);

  const getExpenseAmount = (): number => {
    return expense.amount ||
      expense.amount_ttc ||
      expense.ammount_ttc ||
      0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getExpenseDate = (): string => {
    if (expense.day) {
      return new Date(expense.day).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
    } else if (expense.date) {
      return new Date(expense.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
    }
    return '';
  };

  const getCategoryName = (): string => {
    if (expense.category?.title) {
      return expense.category.title;
    }
    if (expense.category_name) {
      return expense.category_name;
    }
    return t('consultant.expenses.card.unknown_category');
  };

  const getReceiptFilename = (): string => {
    if (expense.media && expense.media.length > 0) {
      return expense.media[0].file_name;
    }

    if (!expense.receipt_path) return t('consultant.expenses.card.no_receipt');

    const parts = expense.receipt_path.split('/');
    return parts[parts.length - 1] || t('consultant.expenses.card.receipt');
  };

  const getReceiptUrl = (): string => {
    if (expense.media && expense.media.length > 0) {
      return expense.media[0].original_url;
    }

    return expense.receipt_url || '';
  };

  const isImage = (): boolean => {
    const url = getReceiptUrl().toLowerCase();
    return url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png');
  };

  const handleFileView = (e: React.MouseEvent) => {
    e.preventDefault();
    if (getReceiptUrl()) {
      setIsFilePreviewOpen(true);
    }
  };

  return (
    <>
      <Card
        className={`shadow-sm hover:shadow-md transition-shadow p-0 ${
          isBeingEdited ? "border-2 border-primary" : ""
        }`}
      >
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/90 text-primary-foreground">
              {getCategoryName()}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2">{formatCurrency(getExpenseAmount())}</CardTitle>
          <CardDescription className="line-clamp-1 mt-1">
            {expense.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <div>{getExpenseDate()}</div>

            <button
              className="truncate ml-2 hover:text-primary hover:underline focus:outline-none"
              onClick={handleFileView}
            >
              {getReceiptFilename()}
            </button>

          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-1 pt-1 pb-2">
          {getReceiptUrl() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileView}
              className="h-7 w-7 p-0"
              aria-label={t('consultant.expenses.card.view_receipt')}
            >
              <IconEye className="h-4 w-4" />
            </Button>
          )}

          {!readOnly && onEdit && (
            <Button
              variant={isBeingEdited ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onEdit(expense.id)}
              className="h-7 w-7 p-0"
              aria-label={t('consultant.expenses.card.edit_expense')}
            >
              <IconEdit className="h-4 w-4" />
            </Button>
          )}

          {!readOnly && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense.id)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              aria-label={t('consultant.expenses.card.delete_expense')}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
      <Dialog open={isFilePreviewOpen} onOpenChange={setIsFilePreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('consultant.expenses.card.receipt_title')}: {getReceiptFilename()}</DialogTitle>
          </DialogHeader>
          <div className="w-full flex justify-center">
            {isImage() ? (
              <img
                src={getReceiptUrl()}
                alt={t('consultant.expenses.card.receipt_alt')}
                className="max-h-[70vh] object-contain"
              />
            ) : (
              <iframe
                src={getReceiptUrl()}
                className="w-full h-[70vh]"
                title={t('consultant.expenses.card.receipt_pdf')}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}