'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IconBell, IconBellFilled, IconCheck, IconChecks, IconExternalLink, IconTrash, IconAlertTriangle, IconInfoCircle, IconAlertOctagon } from '@tabler/icons-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Notification } from '@/types/notification.types';

const SEV_CONFIG = {
  info:     { icon: IconInfoCircle,    color: 'text-blue-500',   bg: 'bg-blue-50',   dot: 'bg-blue-500',   label: 'Info' },
  warning:  { icon: IconAlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50',  dot: 'bg-amber-500',  label: 'Avertissement' },
  critical: { icon: IconAlertOctagon,  color: 'text-red-500',    bg: 'bg-red-50',    dot: 'bg-red-500',    label: 'Critique' },
};

function timeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: summaryRes } = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => notificationService.summary(),
    refetchInterval: 30_000,
  });

  const { data: listRes } = useQuery({
    queryKey: ['notifications', 'list', 'popover'],
    queryFn: () => notificationService.list({ per_page: 8 }),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = summaryRes?.data?.unread ?? 0;
  const notifications: Notification[] = (listRes as any)?.data ?? [];

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markRead.mutateAsync(notif.id);
    }
    setOpen(false);
    if (notif.action_url) {
      router.push(notif.action_url);
    } else {
      router.push('/notifications');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          {unread > 0
            ? <IconBellFilled className="h-5 w-5 text-foreground" />
            : <IconBell className="h-5 w-5 text-muted-foreground" />
          }
          {unread > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center',
              'rounded-full text-[10px] font-bold text-white',
              unread > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-400',
            )}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 p-0 shadow-xl border border-border/60 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <IconBellFilled className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] font-bold bg-red-500 hover:bg-red-500">{unread} non lues</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <IconChecks className="h-3.5 w-3.5 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <IconBell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Aucune notification</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notif) => {
                const sev = SEV_CONFIG[notif.severity as keyof typeof SEV_CONFIG] ?? SEV_CONFIG.info;
                const Icon = sev.icon;

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors',
                      notif.is_read ? 'hover:bg-muted/40' : 'bg-primary/3 hover:bg-primary/6',
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className={cn('absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full', sev.dot)} />
                    )}

                    {/* Icon */}
                    <div className={cn('flex-shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center', sev.bg)}>
                      <Icon className={cn('h-4 w-4', sev.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', notif.is_read ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground/70">{timeAgo(notif.created_at)}</span>
                        {notif.action_url && (
                          <span className="text-[10px] text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconExternalLink className="h-3 w-3" />Ouvrir
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions on hover */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notif.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-blue-100 text-blue-500"
                          title="Marquer comme lue"
                        >
                          <IconCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(notif.id); }}
                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-100 text-red-400"
                        title="Supprimer"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 px-4 py-2.5 bg-muted/20">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Voir toutes les notifications
            <IconExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
