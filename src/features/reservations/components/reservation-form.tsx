'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateReservation, useUpdateReservation } from '../hooks/use-reservations';
import { useAgencies } from '@/features/agencies/hooks/use-agencies';
import { useVehicles } from '@/features/vehicles/hooks/use-vehicles';
import { useClients } from '@/features/clients/hooks/use-clients';
import type { Reservation } from '@/types/reservation.types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PAYMENT_METHOD_OPTIONS } from '@/config/constants';

const schema = z.object({
  agency_id: z.string().min(1, 'Required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  client_id: z.string().min(1, 'Client is required'),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  return_date: z.string().min(1, 'Return date is required'),
  pickup_location: z.string().min(1, 'Pickup location is required'),
  return_location: z.string().min(1, 'Return location is required'),
  daily_rate: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
  additional_fees: z.coerce.number().min(0).optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
}

export function ReservationForm({ open, onOpenChange, reservation }: Props) {
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation(reservation?.id ?? '');
  const { data: agenciesRes } = useAgencies({ per_page: 100 });
  const { data: vehiclesRes } = useVehicles({ per_page: 100, status: 'available' });
  const { data: clientsRes } = useClients({ per_page: 100 });

  const agencies = agenciesRes?.data ?? [];
  const vehicles = vehiclesRes?.data ?? [];
  const clients = clientsRes?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '', vehicle_id: '', client_id: '',
      pickup_date: '', return_date: '',
      pickup_location: '', return_location: '',
      daily_rate: 0, deposit_amount: 0,
      discount_percentage: 0, additional_fees: 0,
      payment_method: '', notes: '',
    },
  });

  useEffect(() => {
    if (reservation) {
      form.reset({
        agency_id: reservation.agency_id,
        vehicle_id: reservation.vehicle_id,
        client_id: reservation.client_id,
        pickup_date: reservation.pickup_date?.split('T')[0] ?? '',
        return_date: reservation.return_date?.split('T')[0] ?? '',
        pickup_location: reservation.pickup_location,
        return_location: reservation.return_location,
        daily_rate: Number(reservation.daily_rate),
        deposit_amount: Number(reservation.deposit_amount),
        discount_percentage: Number(reservation.discount_percentage ?? 0),
        additional_fees: Number(reservation.additional_fees ?? 0),
        payment_method: reservation.payment_method ?? '',
        notes: reservation.notes ?? '',
      });
    } else {
      form.reset({
        agency_id: '', vehicle_id: '', client_id: '',
        pickup_date: '', return_date: '',
        pickup_location: '', return_location: '',
        daily_rate: 0, deposit_amount: 0,
        discount_percentage: 0, additional_fees: 0,
        payment_method: '', notes: '',
      });
    }
  }, [reservation, form, open]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      pickup_date: values.pickup_date + 'T09:00:00',
      return_date: values.return_date + 'T09:00:00',
    };
    if (reservation) {
      updateMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Reservation updated'); onOpenChange(false); },
        onError: () => toast.error('Failed to update reservation'),
      });
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => { toast.success('Reservation created'); onOpenChange(false); form.reset(); },
        onError: () => toast.error('Failed to create reservation'),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{reservation ? 'Edit Reservation' : 'New Reservation'}</SheetTitle>
          <SheetDescription>{reservation ? 'Update reservation details' : 'Create a new vehicle reservation'}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="agency_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>{agencies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehicle_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        const veh = vehicles.find((x) => x.id === v);
                        if (veh) form.setValue('daily_rate', Number(veh.daily_rate));
                      }}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} {v.year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickup_date" render={({ field }) => (
                  <FormItem><FormLabel>Pickup Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="return_date" render={({ field }) => (
                  <FormItem><FormLabel>Return Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pickup_location" render={({ field }) => (
                  <FormItem><FormLabel>Pickup Location *</FormLabel><FormControl><Input placeholder="City / address" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="return_location" render={({ field }) => (
                  <FormItem><FormLabel>Return Location *</FormLabel><FormControl><Input placeholder="City / address" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="daily_rate" render={({ field }) => (
                  <FormItem><FormLabel>Daily Rate (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="deposit_amount" render={({ field }) => (
                  <FormItem><FormLabel>Deposit (MAD) *</FormLabel><FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="discount_percentage" render={({ field }) => (
                  <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="additional_fees" render={({ field }) => (
                  <FormItem><FormLabel>Additional Fees (MAD)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="payment_method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes…" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : reservation ? 'Update' : 'Create Reservation'}</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
