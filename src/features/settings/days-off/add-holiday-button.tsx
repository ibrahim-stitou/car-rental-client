// src/features/settings/days-off/add-holiday-button.tsx
'use client';

import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { DayOffModal } from '@/features/settings/days-off/daysoff-Form-Modal';
import { useDaysOffStore } from '@/stores/days-off-store';
import { useLanguage } from '@/context/LanguageContext';

export default function AddHolidayButton() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedCountry, fetchDaysOff } = useDaysOffStore();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (selectedCountry) {
      fetchDaysOff(selectedCountry);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={cn(buttonVariants(), 'text-xs md:text-sm')}
        disabled={selectedCountry === null}
        title={selectedCountry === null ? t('admin.settings.daysOff.form.selectCountryFirst') : ''}
      >
        <IconPlus className="mr-2 h-4 w-4" />
        {t('admin.settings.daysOff.actions.addHoliday')}
      </button>

      <DayOffModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        dayOff={null}
        selectedCountry={selectedCountry}
      />
    </>
  );
}