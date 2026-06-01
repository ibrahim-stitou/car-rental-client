'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageContainer from '@/components/layout/page-container';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PaymentDialog } from './payment-dialog';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-blue-400',
  active:    'bg-green-400',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-300',
  no_show:   'bg-gray-300',
};

const STATUS_FR: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', active: 'Active',
  completed: 'Terminée', cancelled: 'Annulée', no_show: 'Non présenté',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function ReservationCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [paymentDialog, setPaymentDialog] = useState<{ id: string; ref: string } | null>(null);

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: calRes, isLoading } = useQuery({
    queryKey: ['reservations', 'calendar', startDate, endDate],
    queryFn: () => apiClient.get(apiRoutes.reservations.calendar, { params: { start_date: startDate, end_date: endDate } }).then((r) => r.data),
  });

  const reservations: any[] = (calRes as any)?.data ?? [];

  // Build calendar grid (Mon-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getReservationsForDay = (day: Date) => {
    return reservations.filter((r) => {
      try {
        const pickup = parseISO(r.pickup_date);
        const ret = parseISO(r.return_date);
        return isWithinInterval(day, { start: pickup, end: ret }) || isSameDay(day, pickup) || isSameDay(day, ret);
      } catch { return false; }
    });
  };

  const isCurrentMonth = (day: Date) => day.getMonth() === currentMonth.getMonth();

  return (
    <PageContainer scrollable>
      <div className="p-6 space-y-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendrier des réservations</h1>
            <p className="text-muted-foreground text-sm mt-1">Vue mensuelle de toutes les réservations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] text-center font-semibold text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Aujourd'hui
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUS_FR).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <Card>
          <CardContent className="p-0">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dayReservations = getReservationsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const inMonth = isCurrentMonth(day);

                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] border-r border-b p-1.5 ${
                        !inMonth ? 'bg-muted/20' : ''
                      } ${isToday ? 'bg-primary/5' : ''}`}
                    >
                      {/* Day number */}
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </div>

                      {/* Reservations */}
                      <div className="space-y-0.5">
                        {dayReservations.slice(0, 3).map((r) => {
                          const isStart = isSameDay(day, parseISO(r.pickup_date));
                          const isEnd = isSameDay(day, parseISO(r.return_date));
                          return (
                            <div
                              key={r.id}
                              className={`text-[10px] truncate px-1 py-0.5 rounded cursor-pointer hover:opacity-80 text-white font-medium
                                ${STATUS_COLORS[r.status] ?? 'bg-gray-400'}`}
                              onClick={() => setPaymentDialog({ id: r.id, ref: r.reservation_number ?? r.reference })}
                              title={`${r.reservation_number ?? r.reference} — ${r.client_name ?? r.client?.full_name ?? '?'}`}
                            >
                              {isStart && '▶ '}{isEnd && '◼ '}
                              {r.reservation_number ?? r.reference}
                            </div>
                          );
                        })}
                        {dayReservations.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1">+{dayReservations.length - 3} autre(s)</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(STATUS_FR).map(([status, label]) => {
              const count = reservations.filter((r) => r.status === status).length;
              return (
                <Card key={status}>
                  <CardContent className="pt-3 pb-2 text-center">
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {paymentDialog && (
        <PaymentDialog
          open={!!paymentDialog}
          onOpenChange={(o) => !o && setPaymentDialog(null)}
          reservationId={paymentDialog.id}
          reservationRef={paymentDialog.ref}
        />
      )}
    </PageContainer>
  );
}
