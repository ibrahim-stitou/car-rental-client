'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export default function InvoiceLinesHeader() {
  const { t } = useLanguage();

  return (
    <div className="bg-[#F4F0FF] border-b sticky top-0 z-10 shadow-sm">
      <div className="py-3 px-4">
        <div className="grid grid-cols-12 items-center gap-4">
          {/* Designation - 3 columns */}
          <div className="col-span-3 text-left">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.designation') || 'Designation'}
            </p>
          </div>

          {/* Quantity - 1 column */}
          <div className="col-span-1 text-center">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.quantity') || 'Qty'}
            </p>
          </div>

          {/* Unit Price - 2 columns */}
          <div className="col-span-2 text-right">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.unitPrice') || 'Unit Price'}
            </p>
          </div>

          {/* Tax Rate - 1 column */}
          <div className="col-span-1 text-right">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.taxRate') || 'Tax Rate'}
            </p>
          </div>

          {/* Total HT - 2 columns */}
          <div className="col-span-2 text-right">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.totalHT') || 'Total HT'}
            </p>
          </div>

          {/* Total TTC - 2 columns */}
          <div className="col-span-2 text-right">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.totalTTC') || 'Total TTC'}
            </p>
          </div>

          {/* Actions - 1 column */}
          <div className="col-span-1 text-right">
            <p className="font-semibold text-xs uppercase text-[#3B1E90]">
              {t('admin.invoices.lines.actions') || 'Actions'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}