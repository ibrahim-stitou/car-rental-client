// src/features/settings/banks/banks-listing.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useBanksStore } from '@/stores/banks-store';
import { usePathname } from 'next/navigation';
import BankCard from '@/features/settings/banks/bank-card';
import { DeleteBankModal } from '@/features/settings/banks/delete-bank-modal';
import { BankModal } from '@/features/settings/banks/bank-form-modal';
import { Bank } from '@/stores/banks-store';
import { useLanguage } from '@/context/LanguageContext';
import { Heading } from '@/components/ui/heading';
import AddBankButton from '@/features/settings/banks/add-bank-button';

export default function BanksListing() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Use refs to track initial render and URL cleanup
  const initialCleanupDone = useRef(false);
  const urlCleanupInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    banks,
    isLoading,
    error,
    totalItems,
    selectedCountry,
    fetchBanks
  } = useBanksStore();

  // Local state
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [bankIdToDelete, setBankIdToDelete] = useState<number | null>(null);
  const [bankToEdit, setBankToEdit] = useState<Bank | null>(null);

  // URL cleanup
  useEffect(() => {
    if (!initialCleanupDone.current && window.location.search) {
      window.history.replaceState({}, '', pathname);
      initialCleanupDone.current = true;
    }

    urlCleanupInterval.current = setInterval(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      if (urlCleanupInterval.current) {
        clearInterval(urlCleanupInterval.current);
      }

      urlCleanupInterval.current = setInterval(() => {
        if (window.location.search) {
          window.history.replaceState({}, '', pathname);
        }
      }, 500);
    }, 1000);

    return () => {
      if (urlCleanupInterval.current) {
        clearInterval(urlCleanupInterval.current);
      }
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch banks when params change
  useEffect(() => {
    fetchBanks(selectedCountry, searchDebounced);

    setTimeout(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 0);
  }, [selectedCountry, searchDebounced, fetchBanks, pathname]);

  const handleOpenDeleteModal = (id: number) => {
    setBankIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteBank = async () => {
    if (bankIdToDelete !== null) {
      const { deleteBank } = useBanksStore.getState();
      await deleteBank(bankIdToDelete);
      setIsDeleteModalOpen(false);
      setBankIdToDelete(null);
      refreshData();
    }
  };

  const refreshData = () => {
    fetchBanks(selectedCountry, searchDebounced);

    setTimeout(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 0);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBankIdToDelete(null);
  };

  const handleCloseEditModal = () => {
    setIsAddEditModalOpen(false);
    setBankToEdit(null);
  };

  return (
    <div className="flex flex-1 flex-col space-y-3">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.settings.banks.listing.title')}
          description={t('admin.settings.banks.listing.description')}
        />
        <AddBankButton />
      </div>
      {/* Banks Cards Grid - Increased spacing and changed grid layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-3 px-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-card border rounded-lg p-3 h-40 animate-pulse flex flex-col"
            >
              <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
              <div className="mt-auto">
                <div className="h-6 bg-muted rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 text-destructive">
          <p>{error}</p>
        </div>
      ) : banks.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>{t('admin.settings.banks.listing.noBanks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-6 mt-3 px-2">
          {banks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              onDelete={() => handleOpenDeleteModal(bank.id)}
            />
          ))}
        </div>
      )}

      {/* Total count */}
      <div className="text-sm text-muted-foreground mt-2">
        {totalItems} {totalItems === 1
        ? t('admin.settings.banks.listing.oneBank')
        : t('admin.settings.banks.listing.multipleBank')}
      </div>

      {/* Modals */}
      <DeleteBankModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteBank}
        bankId={bankIdToDelete}
      />

      <BankModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={refreshData}
        bank={bankToEdit}
      />
    </div>
  );
}