'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconDroplet, IconAlertTriangle } from '@tabler/icons-react';

interface OilAlert {
  vehicle_id: string;
  vehicle_name: string;
  registration_number: string;
  current_mileage: number;
  next_oil_change_mileage: number;
  remaining_km: number;
  level: 'overdue' | 'critical' | 'warning';
  maintenance_id: string;
}

function AlertBadge({ level }: { level: OilAlert['level'] }) {
  const config = {
    overdue:  { label: 'Dépassée',  cls: 'bg-red-100 text-red-800 border-red-300' },
    critical: { label: '< 100 km', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
    warning:  { label: '< 500 km', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  }[level];
  return <Badge variant="outline" className={`text-xs ${config.cls}`}>{config.label}</Badge>;
}

export function OilChangeAlerts({ agencyId }: { agencyId?: string }) {
  const { data } = useQuery({
    queryKey: ['oil-change-alerts', agencyId],
    queryFn: () => apiClient.get(apiRoutes.oilChangeAlerts, { params: agencyId ? { agency_id: agencyId } : undefined }).then(r => r.data),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const alerts: OilAlert[] = data?.data?.alerts ?? [];
  const counts = data?.data?.counts ?? {};

  if (alerts.length === 0) return null;

  return (
    <Card className="border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-yellow-800">
          <IconDroplet className="h-4 w-4 text-yellow-600" />
          Alertes vidange
          {(counts.overdue ?? 0) > 0 && (
            <Badge className="bg-red-500 text-white text-xs ml-1">{counts.overdue} dépassée{counts.overdue > 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${
              alert.level === 'overdue' ? 'bg-red-50 border-red-200' :
              alert.level === 'critical' ? 'bg-orange-50 border-orange-200' :
              'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {alert.level === 'overdue' && <IconAlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
              <div>
                <span className="font-medium">{alert.vehicle_name}</span>
                <span className="text-xs text-muted-foreground ml-1 font-mono">({alert.registration_number})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className={`text-xs font-bold ${alert.level === 'overdue' ? 'text-red-700' : 'text-yellow-700'}`}>
                  {alert.level === 'overdue'
                    ? `${Math.abs(alert.remaining_km).toLocaleString('fr-MA')} km dépassé`
                    : `${alert.remaining_km.toLocaleString('fr-MA')} km restant`}
                </div>
                <div className="text-xs text-muted-foreground">
                  Prochaine : {alert.next_oil_change_mileage.toLocaleString('fr-MA')} km
                </div>
              </div>
              <AlertBadge level={alert.level} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
