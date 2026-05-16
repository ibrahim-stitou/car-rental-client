import ActionSystemDetailsView from '@/features/action-system/views/action-system-details';

export default function ActionSystemGeneration({
                                                 params
                                               }: {
  params: { id: string }
}) {
  return <ActionSystemDetailsView id={params.id} />;
}

export const metadata = {
  title: 'Action System Generation Details',
  description: 'Details of action system generation'
};