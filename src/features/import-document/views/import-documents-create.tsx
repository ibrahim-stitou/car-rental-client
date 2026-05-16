import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/context/LanguageContext';
import { useForm } from 'react-hook-form';
import { CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import ImportDocumentsFileUpload from '@/features/import-document/components/import-documents-file-upload';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { PATHS } from '@/config/paths';
import DocumentTypeSelect from '@/components/custom/document-type-select';

export interface UploadedFile {
  name: string;
  path: string;
  mime_type: string;
  size: string;
  collection_name: string;
}

const ImportDocumentsCreate = () => {
  const { t } = useLanguage();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | []>([]);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const schema = z.object({
    month: z
      .string()
      .nonempty(t('admin.documentImports.create.month_required')),
    year: z.string().nonempty(t('admin.documentImports.create.year_required')),
    document_type: z
      .string()
      .nonempty(t('admin.documentImports.create.document_type_required')),
    files: z.array(
      z.string().nonempty(t('admin.documentImports.create.files_required'))
    )
  });
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      month: '',
      year: new Date().getFullYear().toString(),
      document_type: '',
      files: []
    }
  });

  const onSubmit = async (data: any) => {

    if (submitting) return;
    if (uploadedFiles.length === 0) {
      setError(t('admin.documentImports.create.files_required'));
      return;
    }
    setSubmitting(true);
    data.files = uploadedFiles.map((file) => `${file.path},${file.name}`);
    apiClient.post(apiRoutes.admin.import_document.create,data).then(response=>{
      toast.success(response.data.message);
      router.push(PATHS.admin.import_document.list.link);
    }).catch(err=>{
      if (err instanceof AxiosError && err.response?.status === 422) {
        const errorData = err.response.data;
        if (errorData?.errors) {
          Object.keys(errorData.errors).forEach((fieldName) => {
            const messages = errorData.errors[fieldName];
            if (messages && messages.length > 0) {
              methods.setError(
                fieldName as keyof z.infer<typeof schema>,
                {
                  type: 'server',
                  message: messages.join(', ')
                }
              );
            }
          });
        } else if (errorData?.message) {
          toast.error(errorData.message);
        } else {
          toast.error(errorData);
        }
      } else {
        toast.error('An error occurred while making new import.');
      }
    })

    setSubmitting(false);
  };

  return (
    <PageContainer>
      <div className='h-full w-full space-y-4 overflow-auto bg-gray-50 p-3 md:p-6'>
        <div className='flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center'>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>
            {t('admin.documentImports.create.title')}
          </h1>
        </div>
        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className='space-y-4'>
            <CardContent className='space-y-4 pt-4'>
              <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm sm:p-6'>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  <DocumentTypeSelect required name="document_type" form={methods} label={t('admin.documentImports.create.document_type')} placeholder={t('admin.documentImports.create.document_type')}  />

                  <FormField
                    control={methods.control}
                    name='month'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.documentImports.create.month')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue
                                placeholder={t(
                                  'admin.documentImports.create.monthSelect'
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={`${i + 1}`}>
                                  {t(`months.${i + 1}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={methods.control}
                    name='year'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required='true'>
                          {t('admin.documentImports.create.year')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={2000}
                            max={2200}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <ImportDocumentsFileUpload
                  setUploadedFiles={setUploadedFiles}
                  uploadedFiles={uploadedFiles}
                  error={error}
                  setError={setError}
                />
              </section>
            </CardContent>
            <CardFooter className='flex flex-col-reverse justify-between gap-2 border-t pt-6 sm:flex-row'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='w-full sm:w-auto'
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' className='w-full sm:w-auto'>
                {t('common.submit')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};
export default ImportDocumentsCreate;
