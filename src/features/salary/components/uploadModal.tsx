import { FileUploader } from '@/components/file-uploader';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';
import { toast } from 'sonner';
import * as React from 'react';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IconLoader, IconX } from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm?: () => void;
}

const SalaryUploadModal = ({ open, setOpen,onConfirm }: Props) => {
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    path: string;
    mime_type: string;
    size: string;
    collection_name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const disabled = isUploading || isRemoving  || !uploadedFile;

  const schema = z.object({
    file: z.any()
  });
  useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      file: undefined
    }
  });
  const handleUpload = async (files: File[]) => {
    setValidationError(null);
    const formData = new FormData();
    formData.append('file', files[0]);
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
          } else {
            toast.error(t('admin.salaries.uploadError'));
          }
        });
    } catch (error: any) {
      setIsUploading(false);
      console.error('Upload Error:', error);
    }
  };

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

  const handleConfirm = async () => {
    setValidationError(null);
    if (uploadedFile) {
      setIsUploading(true);
      try {
        await apiClient
          .post(apiRoutes.admin.salaries.upload, {
            file: uploadedFile.path
          })
          .then((response) => {
            setIsUploading(false);
            if (response.status === 200) {
              toast.success(response.data.message);
              setOpen(false);
              setUploadedFile(null);
              if (onConfirm) onConfirm();
            } else {
              toast.error(t('admin.salaries.uploadError'));
            }
          });
      } catch (error: any) {
        if (error.status === 422){
          setValidationError(error.response.data.error);
          console.log(error.response.data.error)
        }
        setIsUploading(false);
      }
    }
  };
  const handleDownloadTemplate = async () => {
    try {
      setIsUploading(true);
      const response = await apiClient.get(apiRoutes.admin.salaries.canvas, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', new Date().toISOString() + '-salaries-canvas.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      console.error('Error downloading template:', error);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.salaries.uploadModal.title')}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {t('admin.salaries.uploadModal.description')}
          <Button className="inline-block w-auto p-0" variant='link' onClick={handleDownloadTemplate} >
              {t('admin.salaries.uploadModal.download')}
          </Button>
        </AlertDialogDescription>
        {!uploadedFile && (
          <FileUploader
            onUpload={handleUpload}
            accept={{ 'application/vnd.ms-excel': ['.xlsx'] }}
            maxFiles={1}
          />
        )}
        {uploadedFile && (
          <>
            <div className='relative flex items-center space-x-4'>
              <div className='flex flex-1 space-x-4'>
                <div
                  className='bg-muted text-muted-foreground flex aspect-square size-12 shrink-0 items-center justify-center rounded-md text-xl'>
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
                  className='size-8 rounded-full'
                >
                  {isRemoving ? (
                    <IconLoader />
                  ) : (
                    <>
                      <IconX className='text-muted-foreground' />
                      <span className='sr-only'>{t('dropzone.remove_file')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            {validationError && (
              <p className='text-red-500 text-sm mt-2'>{validationError}</p>
            )}
          </>
        )}
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.close')}
          </Button>
          <Button
            disabled={disabled}
            onClick={handleConfirm}
          >
            {t('admin.salaries.upload')}
          </Button>

        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SalaryUploadModal;
