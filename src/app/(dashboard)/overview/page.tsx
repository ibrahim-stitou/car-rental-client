import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard | Car Rental' };

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </main>
  );
}
