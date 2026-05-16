// src/features/settings/banks/delete-bank-modal.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useBanksStore } from "@/stores/banks-store";
import { useLanguage } from '@/context/LanguageContext';

interface DeleteBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bankId: number | null;
}

export function DeleteBankModal({ isOpen, onClose, onConfirm, bankId }: DeleteBankModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { banks } = useBanksStore();
  const { t } = useLanguage();

  // Find bank name for better UX
  const bankName = bankId ? banks.find(bank => bank.id === bankId)?.name : '';

  const handleDelete = async () => {
    if (!bankId) return;

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.settings.banks.deleteModal.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {bankName ? (
              <>
                {t('admin.settings.banks.deleteModal.descriptionWithName')}
              </>
            ) : (
              <>{t('admin.settings.banks.deleteModal.description')}</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? t('admin.settings.banks.deleteModal.deleting') : t('admin.settings.banks.deleteModal.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}