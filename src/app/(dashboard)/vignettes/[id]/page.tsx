'use client';

import { use } from 'react';
import { VignetteDetailView } from '@/features/vignettes/components/vignette-detail-view';

interface Props { params: Promise<{ id: string }> }

export default function VignetteDetailPage({ params }: Props) {
  const { id } = use(params);
  return <VignetteDetailView vignetteId={id} />;
}
