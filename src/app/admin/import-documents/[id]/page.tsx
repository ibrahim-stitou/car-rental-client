'use client';

import ImportDocumentsList from '@/features/import-document/views/import-documents-list';
import { useParams } from 'next/navigation';
import ImportDocumentsShow from '@/features/import-document/views/import-documents-show';

const ImportDocumentsPage = () => {
  const {id} = useParams();
  return <ImportDocumentsShow id={id as string} />;
};

export default ImportDocumentsPage;