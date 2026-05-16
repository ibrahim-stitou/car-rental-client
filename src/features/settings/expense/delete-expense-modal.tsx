'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expenseId: number | null;
}

export function DeleteExpenseModal({
                                     isOpen,
                                     onClose,
                                     onConfirm,
                                     expenseId
                                   }: DeleteExpenseModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            {t('admin.settings.expenses.deleteModal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.settings.expenses.deleteModal.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}