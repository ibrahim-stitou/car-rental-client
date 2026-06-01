import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const colorMap: Record<string, string> = {
  // Reservation
  pending:    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed:  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  active:     'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  completed:  'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  cancelled:  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  no_show:    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  // Vehicle
  available:     'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  rented:        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance:   'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  out_of_service:'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  // Billing
  draft:    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  paid:     'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  // Maintenance
  scheduled:   'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  // Inspection
  passed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  // Payment
  partial:  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  // Priority
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
  // Web reservation
  converted: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  rejected:  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
};

const labelMap: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', active: 'Active', completed: 'Terminée',
  cancelled: 'Annulée', no_show: 'Non présenté', available: 'Disponible', rented: 'Loué',
  maintenance: 'En maintenance', out_of_service: 'Hors service', draft: 'Brouillon',
  approved: 'Approuvé', paid: 'Payé', scheduled: 'Planifiée', in_progress: 'En cours',
  passed: 'Réussi', failed: 'Échoué', partial: 'Partiel', refunded: 'Remboursé',
  low: 'Faible', medium: 'Moyenne', high: 'Élevée', urgent: 'Urgente',
  converted: 'Converti', rejected: 'Rejeté',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = colorMap[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const label = labelMap[status] ?? status.replace(/_/g, ' ');
  return (
    <Badge variant="outline" className={cn('capitalize font-medium text-xs', colorClass, className)}>
      {label}
    </Badge>
  );
}
