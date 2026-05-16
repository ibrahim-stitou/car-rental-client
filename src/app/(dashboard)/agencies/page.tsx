import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agencies | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Agencies</h1>
    </main>
  );
}

