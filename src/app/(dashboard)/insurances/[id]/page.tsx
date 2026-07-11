'use client';

import { use } from 'react';
import { InsuranceDetailView } from '@/features/insurances/components/insurance-detail-view';

interface Props { params: Promise<{ id: string }> }

export default function InsuranceDetailPage({ params }: Props) {
  const { id } = use(params);
  return <InsuranceDetailView insuranceId={id} />;
}
