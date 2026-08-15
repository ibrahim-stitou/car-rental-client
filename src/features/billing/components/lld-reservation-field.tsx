'use client';

import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { useDebounce } from '@/hooks/use-debounce';
import { useReservations } from '@/features/reservations/hooks/use-reservations';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SelectField } from '@/components/shared/select-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { Reservation } from '@/types/reservation.types';

function fmtMoney(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  reservationId: string | undefined;
  onApply: (reservation: Reservation) => void;
}

// Shared between billing-create-view and billing-edit-view — both need the
// same "search & link an LLD reservation" step and the same invoiced/paid
// progress bars, so this lives in one place instead of being reimplemented
// (and drifting) in each view.
export function LldReservationField({ control, reservationId, onApply }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: reservationsRes } = useReservations({
    rental_unit: 'month', search: debouncedSearch || undefined, per_page: 20,
  });
  const reservations = reservationsRes?.data ?? [];
  const options = reservations.map((r) => ({
    value: r.id,
    label: `${r.reference} — ${r.client?.full_name ?? ''}`,
    sub: r.vehicle?.full_name,
  }));
  const selected = reservations.find((r) => r.id === reservationId);

  const totalContractValue = selected ? Number(selected.monthly_rate ?? 0) * Number(selected.total_months ?? 0) : 0;
  const invoicedAmount = Number(selected?.invoiced_amount ?? 0);
  const paidAmount = Number(selected?.paid_amount ?? 0);
  const invoicedPct = totalContractValue ? Math.min(100, (100 * invoicedAmount) / totalContractValue) : 0;
  const paidPct = totalContractValue ? Math.min(100, (100 * paidAmount) / totalContractValue) : 0;

  return (
    <FormField control={control} name="reservation_id" render={() => (
      <FormItem>
        <FormLabel>Contrat LLD <span className="text-red-500">*</span></FormLabel>
        <SelectField
          value={reservationId || undefined}
          onChange={(id) => {
            const r = reservations.find((x) => x.id === id);
            if (r) onApply(r);
          }}
          onSearchChange={setSearch}
          options={options}
          placeholder="Rechercher un contrat LLD (référence, client, véhicule)…"
          searchPlaceholder="Rechercher…"
          emptyText="Aucun contrat LLD trouvé"
        />
        <FormMessage />
        {selected && (
          <Alert className="mt-2">
            <AlertDescription className="text-xs space-y-3">
              <p>
                {selected.total_months} mois × {Number(selected.monthly_rate ?? 0).toLocaleString('fr-MA')} MAD/mois —
                {' '}mois {selected.months_due}/{selected.total_months} facturable(s) à ce jour.
                La ligne ci-dessous a été pré-remplie — ajustez-la si vous facturez plusieurs mois ou un montant différent.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Déjà facturé (LLD)</span>
                  <span className="font-medium">{fmtMoney(invoicedAmount)} / {fmtMoney(totalContractValue)} MAD</span>
                </div>
                <Progress value={invoicedPct} className={invoicedAmount > totalContractValue ? '[&>div]:bg-red-600' : '[&>div]:bg-blue-600'} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Déjà payé</span>
                  <span className="font-medium">{fmtMoney(paidAmount)} / {fmtMoney(totalContractValue)} MAD</span>
                </div>
                <Progress
                  value={paidPct}
                  className={paidAmount < invoicedAmount ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-600'}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </FormItem>
    )} />
  );
}
