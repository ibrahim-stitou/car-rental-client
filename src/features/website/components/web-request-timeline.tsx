'use client';

import { Bell, Mail, MessageCircle, Phone, RefreshCw, StickyNote, UserCheck } from 'lucide-react';
import type { WebRequestEvent, WebRequestStatus } from '@/types/website.types';
import { CALL_OUTCOMES, EVENT_TYPES, NOTIFICATION_LABELS, REQUEST_STATUS } from '../constants';
import { formatDateTime } from '../utils';

function describe(event: WebRequestEvent): { icon: React.ElementType; title: string; tone: string } {
  const meta = (event.meta ?? {}) as Record<string, string | null>;

  switch (event.type) {
    case 'status_change': {
      const to = REQUEST_STATUS[meta.to as WebRequestStatus]?.label ?? meta.to;
      const by = meta.by === 'client' ? ' par le client' : meta.by === 'system' ? ' automatiquement' : '';
      return { icon: RefreshCw, title: meta.from ? `Statut : ${to}${by}` : 'Demande reçue', tone: 'bg-slate-100 text-slate-600' };
    }
    case 'notification_sent': {
      const failed = event.outcome?.endsWith('_failed');
      const kind = event.outcome?.replace(/_failed$/, '') ?? '';
      return {
        icon: Bell,
        title: failed ? `Échec d'envoi : ${NOTIFICATION_LABELS[kind] ?? kind}` : NOTIFICATION_LABELS[kind] ?? 'Notification envoyée',
        tone: failed ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600',
      };
    }
    case 'call': {
      const outcome = CALL_OUTCOMES.find((o) => o.value === event.outcome)?.label;
      return { icon: Phone, title: `Appel${outcome ? ` — ${outcome}` : ''}`, tone: 'bg-blue-100 text-blue-600' };
    }
    case 'whatsapp':
      return { icon: MessageCircle, title: 'Message WhatsApp', tone: 'bg-green-100 text-green-600' };
    case 'email':
      return { icon: Mail, title: 'E-mail', tone: 'bg-purple-100 text-purple-600' };
    case 'note':
      if (event.outcome === 'assigned') {
        return { icon: UserCheck, title: meta.assigned_to ? 'Prise en charge' : 'Demande libérée', tone: 'bg-slate-100 text-slate-600' };
      }
      return { icon: StickyNote, title: 'Note interne', tone: 'bg-amber-100 text-amber-600' };
    default:
      return { icon: StickyNote, title: EVENT_TYPES.find((t) => t.value === event.type)?.label ?? event.type, tone: 'bg-slate-100 text-slate-600' };
  }
}

export function WebRequestTimeline({ events }: { events: WebRequestEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Aucun échange pour l&apos;instant.</p>;
  }

  const sorted = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <ol className="relative space-y-4 border-l pl-6">
      {sorted.map((event) => {
        const { icon: Icon, title, tone } = describe(event);
        return (
          <li key={event.id} className="relative">
            <span className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.created_at)}{event.user && ` · ${event.user.full_name}`}
              </p>
            </div>
            {event.body && event.type !== 'notification_sent' && (
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{event.body}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
