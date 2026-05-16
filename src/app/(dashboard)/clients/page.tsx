import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Clients | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Clients</h1>
    </main>
  );
}

