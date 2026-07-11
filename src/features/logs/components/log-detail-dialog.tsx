'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AUDIT_EVENT_LABELS, AUDIT_RESOURCE_OPTIONS, type AuditLog } from '@/types/log.types';

interface LogDetailDialogProps {
  log: AuditLog | null;
  onOpenChange: (open: boolean) => void;
}

function resourceLabel(auditableType: string): string {
  const shortKey = auditableType.split('\\').pop() ?? auditableType;
  const key = shortKey
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return AUDIT_RESOURCE_OPTIONS.find((o) => o.value === key)?.label ?? shortKey;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function LogDetailDialog({ log, onOpenChange }: LogDetailDialogProps) {
  if (!log) return null;

  const fields = Array.from(
    new Set([...Object.keys(log.old_values ?? {}), ...Object.keys(log.new_values ?? {})])
  );

  const userLabel = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Système';

  return (
    <Dialog open={!!log} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{AUDIT_EVENT_LABELS[log.event] ?? log.event}</Badge>
            <span>{resourceLabel(log.auditable_type)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Utilisateur</span>
            <p className="font-medium">{userLabel}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date</span>
            <p className="font-medium">{new Date(log.created_at).toLocaleString('fr-MA')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Adresse IP</span>
            <p className="font-medium">{log.ip_address ?? '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Identifiant enregistrement</span>
            <p className="font-medium break-all">{log.auditable_id}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Détail des modifications</p>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée de champ disponible.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Champ</th>
                    <th className="text-left p-2 font-medium">Ancienne valeur</th>
                    <th className="text-left p-2 font-medium">Nouvelle valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field} className="border-t">
                      <td className="p-2 font-medium text-muted-foreground">{field}</td>
                      <td className="p-2 text-red-600 dark:text-red-400 break-all">
                        {formatValue(log.old_values?.[field])}
                      </td>
                      <td className="p-2 text-green-600 dark:text-green-400 break-all">
                        {formatValue(log.new_values?.[field])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
