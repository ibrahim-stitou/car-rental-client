import React, { useState } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconLoader, IconX } from '@tabler/icons-react';
import { UploadedFile } from '../views/import-documents-create';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  error?: string;
  setError?: React.Dispatch<React.SetStateAction<string>>;
}

const ImportDocumentsFileUpload = ({
  uploadedFiles,
  setUploadedFiles,
  error,
  setError
}: Props) => {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const handleUpload = async (files: File[]) => {
    setValidationError(null);
    setError?.('');
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collection', 'default');
      try {
        setIsUploading(true);
        await apiClient
          .post(apiRoutes.files.uploadTemp, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          .then((response) => {
            setIsUploading(false);
            if (response.status === 200) {
              const data = response.data;
              setUploadedFiles((prev) => [
                ...prev,
                {
                  name: data.name,
                  path: data.path,
                  mime_type: data.mime_type,
                  size: data.size,
                  collection_name: data.collection_name
                }
              ]);
            } else {
              toast.error(t('admin.documentImports.uploadError'));
            }
          });
      } catch (error: any) {
        setIsUploading(false);
        setValidationError(error.response.data.error);
        toast.error(error.response.data.message || t('admin.salaries.uploadError'));
        console.error('Upload Error:', error);
      }
    }
  };

  const onRemove = async (file: UploadedFile) => {
    if (uploadedFiles.length > 0) {
      setIsRemoving(true);
      try {
        await apiClient
          .post(apiRoutes.files.cleanupTemp, {
            paths: [file.path]
          })
          .then((response) => {
            setIsRemoving(false);
            setValidationError(null);
            if (response.status === 200) {
              setUploadedFiles(
                uploadedFiles.filter(
                  (uploadedFile) => uploadedFile.path !== file.path
                )
              );
            } else {
              toast.error(t('admin.documentImports.cleanupError'));
            }
          });
      } catch (error: any) {
        setIsRemoving(false);
        setUploadedFiles(
          uploadedFiles.filter(
            (uploadedFile) => uploadedFile.path !== file.path
          )
        );
        setValidationError(null);
        console.error('Error:', error);
      }
    }
  };
  return (
    <div>
      <FileUploader
        onUpload={handleUpload}
        multiple
        accept={{ 'application/pdf': [] }}
      />
      {false && (
        <div className='bg-accent mt-6 grid w-full gap-4 rounded-sm p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.path}
              className='relative flex items-center space-x-4 rounded-md bg-white p-1'
            >
              <div className='flex flex-1 space-x-4'>
                <div className='bg-muted text-muted-foreground flex aspect-square size-12 shrink-0 items-center justify-center rounded-md text-xl'>
                  📄
                </div>
                <div className='flex w-full flex-col gap-2'>
                  <div className='space-y-px'>
                    <p className='text-foreground/80 line-clamp-1 text-sm font-medium'>
                      {uploadedFile.name}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {formatBytes(+uploadedFile.size)}
                    </p>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => onRemove(uploadedFile)}
                  className='size-8 cursor-pointer rounded-full'
                >
                  {isRemoving ? (
                    <IconLoader />
                  ) : (
                    <>
                      <IconX className='text-muted-foreground' />
                      <span className='sr-only'>
                        {t('dropzone.remove_file')}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(validationError || error) && (
        <p className='mt-2 text-sm text-red-500'>{validationError ?? error}</p>
      )}
    </div>
  );
};

export default ImportDocumentsFileUpload;
