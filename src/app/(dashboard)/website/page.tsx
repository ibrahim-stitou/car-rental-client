import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Website | Car Rental' };

export default function WebsitePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight">Website Management</h1>
      <p className="text-muted-foreground text-sm mt-1">Manage public website reservations and vehicles</p>
      <p className="mt-8 text-muted-foreground text-sm">Coming soon — web reservation approval workflow</p>
    </div>
  );
}
