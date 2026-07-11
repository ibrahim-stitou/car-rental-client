import { IconMail, IconWorld } from '@tabler/icons-react';
import { APP_NAME, CONTACT_EMAILS, WEBSITE_DOMAIN, WEBSITE_URL } from '@/config/brand';
import { cn } from '@/lib/utils';

interface ContactFooterProps {
  className?: string;
  dark?: boolean;
  /** Show the myfleet-control.com website link (default true). */
  showWebsite?: boolean;
}

export function ContactFooter({ className, dark = false, showWebsite = true }: ContactFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('space-y-3 text-center', className)}>
      {showWebsite && (
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold hover:underline',
            dark ? 'text-white hover:text-primary' : 'text-foreground hover:text-primary'
          )}
        >
          <IconWorld className="h-4 w-4" />
          {WEBSITE_DOMAIN}
        </a>
      )}
      <div className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs', dark ? 'text-slate-400' : 'text-muted-foreground')}>
        {CONTACT_EMAILS.map((c) => (
          <a
            key={c.email}
            href={`mailto:${c.email}`}
            className={cn('inline-flex items-center gap-1 hover:underline', dark ? 'hover:text-white' : 'hover:text-foreground')}
          >
            <IconMail className="h-3.5 w-3.5" />
            {c.email}
          </a>
        ))}
      </div>
      <p className={cn('text-xs', dark ? 'text-slate-500' : 'text-muted-foreground')}>
        &copy; {year} {APP_NAME} &middot; Tous droits réservés
      </p>
    </footer>
  );
}
