// src/app/admin/export-documents/page.tsx
import { ExportDocumentListing } from '@/features/export-document/views/export-document-list';

export const metadata = {
  title: 'Admin: Export Documents',
  description: 'Manage and view exported documents'
};

const ExportDocumentsPage = () => {
  return <ExportDocumentListing />;
};

export default ExportDocumentsPage;