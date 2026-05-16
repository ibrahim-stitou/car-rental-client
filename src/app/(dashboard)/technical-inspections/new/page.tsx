import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Technical Inspections | Car Rental' };

export default function NewPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">New Technical Inspections</h1>
    </main>
  );
}

