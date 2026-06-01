import type { Metadata } from 'next';
import { OverviewView } from '@/features/overview/components/overview-view';

export const metadata: Metadata = { title: 'Dashboard | Car Rental' };

export default function Page() { return <OverviewView />; }
