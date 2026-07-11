'use client';

import { use } from 'react';
import { MaintenanceDetailView } from '@/features/maintenances/components/maintenance-detail-view';

interface Props { params: Promise<{ id: string }> }

export default function MaintenanceDetailPage({ params }: Props) {
  const { id } = use(params);
  return <MaintenanceDetailView maintenanceId={id} />;
}
