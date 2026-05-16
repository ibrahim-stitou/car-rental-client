import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Vehicles | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Vehicles</h1>
    </main>
  );
}

