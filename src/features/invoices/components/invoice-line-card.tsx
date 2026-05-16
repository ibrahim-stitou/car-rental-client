'use client';

import { Button } from '@/components/ui/button';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  designation: string;
  nombre: number;
  amount_ht: number;
  tva: number;
  total_ht?: number | string;
  total_ttc?: number | string;
  created_at?: string;
  updated_at?: string;
}

interface InvoiceLineCardProps {
  invoiceLine: InvoiceLineItem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => Promise<void>;
  isBeingEdited?: boolean;
  readOnly?: boolean;
  isEven?: boolean;
}

export default function InvoiceLineCard({
  invoiceLine,
  onEdit,
  onDelete,
  isBeingEdited = false,
  readOnly = false,
  isEven = false,
}: InvoiceLineCardProps) {
  // Calculate totals if not provided
  const totalHT = typeof invoiceLine.total_ht === 'string' 
    ? parseFloat(invoiceLine.total_ht) 
    : (invoiceLine.total_ht || invoiceLine.nombre * invoiceLine.amount_ht);
  
  const totalTTC = typeof invoiceLine.total_ttc === 'string'
    ? parseFloat(invoiceLine.total_ttc)
    : (invoiceLine.total_ttc || totalHT * (1 + invoiceLine.tva / 100));

  return (
    <div 
      className={cn(
        "border-b last:border-b-0 transition-colors duration-150",
        isBeingEdited 
          ? "bg-[#F4F0FF] border-[#5E43B0]" 
          : isEven 
            ? "bg-gray-50" 
            : "bg-white",
        "hover:bg-gray-50"
      )}
    >
      <div className="py-3 px-4">
        <div className="grid grid-cols-12 items-center gap-4">
          {/* Designation - 3 columns.tsx */}
          <div className="col-span-3 text-left">
            <p className="font-medium text-sm truncate" title={invoiceLine.designation}>
              {invoiceLine.designation}
            </p>
          </div>
          
          {/* Quantity - 1 column */}
          <div className="col-span-1 text-center">
            <p className="text-sm text-gray-700 font-medium">{invoiceLine.nombre}</p>
          </div>
          
          {/* Unit Price - 2 columns.tsx */}
          <div className="col-span-2 text-right">
            <p className="text-sm text-gray-700">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2
              }).format(invoiceLine.amount_ht)}
            </p>
          </div>
          
          {/* VAT - 1 column */}
          <div className="col-span-1 text-center">
            <p className="text-sm text-gray-700">{invoiceLine.tva}%</p>
          </div>
          
          {/* Total HT - 2 columns.tsx */}
          <div className="col-span-2 text-right">
            <p className="text-sm font-medium text-gray-800">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2
              }).format(totalHT)}
            </p>
          </div>
          
          {/* Total TTC - 2 columns.tsx */}
          <div className="col-span-2 text-right">
            <p className="text-sm font-medium text-[#3B1E90]">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2
              }).format(totalTTC)}
            </p>
          </div>
          
          {/* Actions - 1 column */}
          <div className="col-span-1">
            {!readOnly && (
              <div className="flex justify-end space-x-1 items-center">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#5E43B0] hover:bg-[#F4F0FF] hover:text-[#3B1E90]"
                    onClick={() => onEdit(invoiceLine.id)}
                  >
                    <IconPencil size={16} />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDelete(invoiceLine.id)}
                  >
                    <IconTrash size={16} />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}