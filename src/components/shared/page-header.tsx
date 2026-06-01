'use client';

import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, onAdd, addLabel = 'New', actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <IconPlus className="mr-1.5 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
