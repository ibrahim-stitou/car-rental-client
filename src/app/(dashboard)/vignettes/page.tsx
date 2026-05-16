import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Vignettes | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Vignettes</h1>
    </main>
  );
}

