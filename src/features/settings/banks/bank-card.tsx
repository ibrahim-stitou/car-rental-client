// src/features/settings/banks/bank-card.tsx
'use client';
import { Bank, useBanksStore } from '@/stores/banks-store';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Globe, CreditCard, Building, CheckCircle, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/context/LanguageContext';

interface BankCardProps {
  bank: Bank;
  onDelete: () => void;
}

export default function BankCard({ bank, onDelete }: BankCardProps) {
  const { t } = useLanguage();
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toggleBankStatus } = useBanksStore();

  // Function to open confirmation dialog
  const openConfirmation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmation(true);
  };

  // Function to handle actual status toggle
  const handleToggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await toggleBankStatus(bank.id);
      setShowConfirmation(false);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      {/* Modified card with adjusted width and height */}
      <Card className="overflow-hidden h-64 flex flex-col transition-all hover:shadow-md p-0 group mx-0 my-0 max-w-85 ">
        {/* Header with default icon background */}
        <div className="h-16 relative bg-gradient-to-br from-slate-10 to-slate-200 w-full m-0">
          {/* Default Bank Icon */}
          <div className="w-full h-full flex items-center justify-center">
            <Building className="w-12 h-12 text-slate-300 group-hover:text-slate-400 transition-colors" />
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={bank.is_active ? "default" : "outline"}
              className={`font-medium text-xs px-2.5 py-0.5 rounded-full ${
                bank.is_active
                  ? "bg-green-500/90 hover:bg-green-600 text-white shadow-sm"
                  : "bg-white/90 border-slate-200 text-slate-600 shadow-sm"
              }`}
            >
              {bank.is_active ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t('admin.settings.banks.status.active')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>{t('admin.settings.banks.status.inactive')}</span>
                </div>
              )}
            </Badge>
          </div>
        </div>

        <CardContent className="pt-0 pb-0 px-2 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base mb-0.5 truncate group-hover:text-primary transition-colors">{bank.name}</h3>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-slate-500" />
                <span className="truncate font-medium" title={bank.bic}>
                  {t('admin.settings.banks.fields.bic')}: {bank.bic}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-slate-500" />
                <span className="font-medium">
                  {bank.country?.nom || t('admin.settings.banks.fields.countryNotSpecified')}
                </span>
              </div>

              {bank.iban && (
                <div className="text-xs bg-slate-50 p-0.5 rounded-md border border-slate-100 mt-0.5">
                  <span className="block truncate font-mono" title={bank.iban}>
                    {t('admin.settings.banks.fields.iban')}: {bank.iban}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="py-1 px-2 flex items-center justify-between border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-2">
            <Switch
              checked={bank.is_active}
              onClick={openConfirmation}
              disabled={isToggling}
              className={`${bank.is_active ? 'bg-green-500' : ''}`}
            />
            <span className={`text-xs font-medium ${isToggling ? 'text-slate-400' : (bank.is_active ? 'text-green-600' : 'text-slate-500')}`}>
              {isToggling
                ? t('admin.settings.banks.status.updating')
                : (bank.is_active
                  ? t('admin.settings.banks.status.active')
                  : t('admin.settings.banks.status.inactive'))}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title={t('admin.settings.banks.actions.delete')}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              {bank.is_active
                ? t('admin.settings.banks.toggleModal.deactivateTitle')
                : t('admin.settings.banks.toggleModal.activateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {bank.is_active
                ? t('admin.settings.banks.toggleModal.deactivateDescription')
                : t('admin.settings.banks.toggleModal.activateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="font-medium">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`font-medium ${
                bank.is_active
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {isToggling
                ? t('admin.settings.banks.toggleModal.processing')
                : (bank.is_active
                  ? t('admin.settings.banks.toggleModal.deactivate')
                  : t('admin.settings.banks.toggleModal.activate'))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}