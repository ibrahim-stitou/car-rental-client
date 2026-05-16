import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Roles | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Roles</h1>
    </main>
  );
}

