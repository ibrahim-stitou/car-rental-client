import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Technical Inspections | Car Rental' };

export default function ListPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Technical Inspections</h1>
    </main>
  );
}

