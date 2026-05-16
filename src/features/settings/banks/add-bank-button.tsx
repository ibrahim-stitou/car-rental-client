// src/features/settings/banks/add-bank-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BankModal } from '@/features/settings/banks/bank-form-modal';
import { useBanksStore } from '@/stores/banks-store';
import { useLanguage } from '@/context/LanguageContext';

export default function AddBankButton() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchBanks } = useBanksStore();

  const handleSuccess = () => {
    fetchBanks();
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('admin.settings.banks.actions.addBank')}
      </Button>

      <BankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        bank={null}
      />
    </>
  );
}