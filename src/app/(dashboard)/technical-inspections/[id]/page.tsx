'use client';

import { use } from 'react';
import { TechnicalInspectionDetailView } from '@/features/technical-inspections/components/technical-inspection-detail-view';

interface Props { params: Promise<{ id: string }> }

export default function TechnicalInspectionDetailPage({ params }: Props) {
  const { id } = use(params);
  return <TechnicalInspectionDetailView inspectionId={id} />;
}
