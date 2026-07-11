import type { Metadata } from 'next';
import { LogsView } from '@/features/logs/components/logs-view';

export const metadata: Metadata = { title: 'Audit Logs | MyFleet-Control' };

export default function LogsPage() {
  return <LogsView />;
}
