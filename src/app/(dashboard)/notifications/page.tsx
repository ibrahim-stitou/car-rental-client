import type { Metadata } from 'next';
import { NotificationsView } from '@/features/notifications/components/notifications-view';

export const metadata: Metadata = { title: 'Notifications | Car Rental' };

export default function NotificationsPage() {
  return <NotificationsView />;
}
