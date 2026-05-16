// src/features/settings/days-off/delete-holiday-modal.tsx
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
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
interface DeleteHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  dayOffId: number | null;
}

export function DeleteHolidayModal({
                                     isOpen,
                                     onClose,
                                     onConfirm,
                                     dayOffId
                                   }: DeleteHolidayModalProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (dayOffId === null) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {t('admin.settings.daysOff.deleteModal.title')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.settings.daysOff.deleteModal.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting || dayOffId === null}
          >
            {isDeleting
              ? t('admin.settings.daysOff.deleteModal.deleting')
              : t('admin.settings.daysOff.deleteModal.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}