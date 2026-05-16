import React, { useEffect, useState } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconLoader, IconX } from '@tabler/icons-react';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export interface UploadedFile {
  name: string;
  path: string;
  mime_type: string;
  size: string;
  collection_name: string;
}

interface Props {
  uploadedFile: UploadedFile | null;
  setUploadedFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>;
  error?: string;
  setError?: React.Dispatch<React.SetStateAction<string>>;
}

const SalaryFileUpload = ({
  uploadedFile,
  setUploadedFile,
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
    
    if (files.length === 0) return;
    
    const file = files[0]; // Only use the first file
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
            setUploadedFile({
              name: data.name,
              path: data.path,
              mime_type: data.mime_type,
              size: data.size,
              collection_name: data.collection_name
            });
            toast.success(t('admin.salaries.uploadSuccess'));
          } else {
            setValidationError(response.data.error);
            toast.error(t('admin.salaries.uploadError'));
          }
        }).catch((error) => {
          setIsUploading(false);
          setUploadedFile(null);
          setValidationError(error.response.data.error);
          toast.error(error.response.data.message || t('admin.salaries.uploadError'));
        });
    } catch (error: any) {
      setIsUploading(false);
      console.error('Upload Error:', error);
    }
  };

  useEffect(() => {
    console.log(uploadedFile)
  },[uploadedFile])

  const onRemove = async () => {
    if (uploadedFile) {
      setIsRemoving(true);
      try {
        await apiClient
          .post(apiRoutes.files.cleanupTemp, {
            paths: [uploadedFile.path]
          })
          .then((response) => {
            setIsRemoving(false);
            setValidationError(null);
            if (response.status === 200) {
              setUploadedFile(null);
            } else {
              toast.error(t('admin.salaries.cleanupError'));
            }
          });
      } catch (error: any) {
        setIsRemoving(false);
        setUploadedFile(null);
        setValidationError(null);
        console.error('Error:', error);
      }
    }
  };

  return (
    <div>
      {!uploadedFile ? (
        <FileUploader
          onUpload={handleUpload}
          accept={{ 'application/pdf': [] }}
          maxFiles={1}
        />
      ) : (
        <div className='bg-accent mt-2 rounded-sm p-3'>
          <div className='relative flex items-center space-x-4 rounded-md bg-white p-1'>
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
                onClick={onRemove}
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
        </div>
      )}
      {(validationError || error) && (
        <p className='mt-2 text-sm text-red-500'>{validationError ?? error}</p>
      )}
    </div>
  );
};

export default SalaryFileUpload;