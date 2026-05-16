import FlatFeesGenerationDetailsView from '@/features/flat-fees/views/flat-fees-generation-details';

export default function FlatFeesGenerationDetailsPage({
                                                        params
                                                      }: {
  params: { id: string }
}) {
  return <FlatFeesGenerationDetailsView id={params.id} />;
}

export const metadata = {
  title: 'Flat Fees Generation Details',
  description: 'Details of flat fees generation'
};