'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import apiClient from '@/lib/api';
import {
  CalendarIcon, UserIcon, MapPinIcon, PhoneIcon, MailIcon,
  BriefcaseIcon, AlertTriangleIcon, FileTextIcon, DownloadIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRoutes } from '@/config/apiRoutes';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Document {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  collection_name: string;
  created_at: string;
  original_url: string;
}

export default function ProfileViewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({
    id_documents: [],
    social_security: [],
    cv: [],
    iban_documents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(apiRoutes.consultant.profile.detail);
        const userData = response.data.data;
        setUser(userData);
        const mediaItems = userData.media || [];
        const groupedDocs: Record<string, Document[]> = {
          id_documents: [],
          social_security: [],
          cv: [],
          iban_documents: []
        };

        mediaItems.forEach((doc: any) => {
          const collection = doc.collection_name;
          if (['id_documents', 'social_security', 'cv', 'iban_documents'].includes(collection)) {
            if (!groupedDocs[collection]) groupedDocs[collection] = [];
            groupedDocs[collection].push({
              ...doc,
              name: doc.file_name,
              url: doc.original_url
            });
          }
        });

        setDocuments(groupedDocs);
      } catch (error) {
        setError(t('consultant.profile.error.loading'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const formatDate = (dateString: string) => {
    if (!dateString) return t('consultant.profile.error.not_specified');
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return t('consultant.profile.error.invalide_date');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-3 space-y-4 bg-gray-50">
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="w-full border shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="border p-4 rounded-md space-y-4 bg-white shadow-sm">
                <Skeleton className="h-6 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-3 space-y-4 bg-gray-50">
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>{t('common.back')}</Button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-start justify-end px-6'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='flex justify-end'
        >
          Back
        </Button>
      </div>
      <CardContent className='space-y-6 pt-4'>
        {/* Personal Information Section */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <UserIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('consultant.profile.personal_info')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.full_name')}</h4>
              <p className='mt-1'>
                {user.prenom} {user.nom}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.email')}</h4>
              <p className='mt-1 flex items-center'>
                <MailIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.email || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.phone_number')}
              </h4>
              <p className='mt-1 flex items-center'>
                <PhoneIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.telephone || 'Not specified'}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.gender')}</h4>
              <p className='mt-1'>
                {user.sexe_complet ||
                  (user.sexe === 'M'
                    ? 'Male'
                    : user.sexe === 'F'
                      ? 'Female'
                      : 'Not specified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.birth_date')}
              </h4>
              <p className='mt-1 flex items-center'>
                <CalendarIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.date_naissance
                  ? formatDate(user.date_naissance)
                  : 'Not specified'}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.role')}</h4>
              <p className='mt-1'>{user.role?.name || 'Not assigned'}</p>
            </div>
          </div>
        </section>

        {/* Address Section */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <MapPinIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('consultant.profile.adress_details')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='md:col-span-3'>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.street_adress')}
              </h4>
              <p className='mt-1'>{user.adresse || t('consultant.profile.error.not_specified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.city')}</h4>
              <p className='mt-1'>{user.ville ||  t('consultant.profile.error.not_specified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.code_postal')}</h4>
              <p className='mt-1'>{user.code_postal ||  t('consultant.profile.error.not_specified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('consultant.profile.country')}</h4>
              <p className='mt-1'>{user.pays?.nom ||  t('consultant.profile.error.not_specified')}</p>
            </div>
          </div>
        </section>

        {/* Professional Information */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <BriefcaseIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('consultant.profile.personal_info')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.social_security_number')}
              </h4>
              <p className='mt-1'>{user.numero_secu || t('consultant.profile.error.not_specified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.siret')}
              </h4>
              <p className='mt-1'>{user.siret ||  t('consultant.profile.error.not_specified')}</p>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <AlertTriangleIcon className='mr-2 h-5 w-5 text-amber-500' />
            {t('consultant.profile.emergency_contact')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.contact_name')}
              </h4>
              <p className='mt-1'>
                {user.emergency_fullname ||  t('consultant.profile.error.not_specified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.contact_phone')}
              </h4>
              <p className='mt-1'>{user.emergency_tel ||  t('consultant.profile.error.not_specified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.relationship')}
              </h4>
              <p className='mt-1'>
                {user.emergency_relation ||  t('consultant.profile.error.not_specified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.additionnal_info')}
              </h4>
              <p className='mt-1'>{user.additional_info ||  t('consultant.profile.error.not_specified')}</p>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <UserIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('consultant.profile.account_info')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.account_created')}
              </h4>
              <p className='mt-1'>
                {user.created_at ? formatDate(user.created_at) : t('consultant.profile.error.unkown')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('consultant.profile.last_updated')}
              </h4>
              <p className='mt-1'>
                {user.updated_at ? formatDate(user.updated_at) :  t('consultant.profile.error.unkown')}
              </p>
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <FileTextIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('consultant.profile.documents')}
          </h3>

          <Tabs defaultValue='id_documents' className='w-full'>
            <TabsList className='grid grid-cols-4'>
              <TabsTrigger value='id_documents'>{t('consultant.profile.id_documents')}</TabsTrigger>
              <TabsTrigger value='social_security'>{t('consultant.profile.social_security')}</TabsTrigger>
              <TabsTrigger value='cv'>{t('consultant.profile.cv_resume')}</TabsTrigger>
              <TabsTrigger value='iban_documents'>{t('consultant.profile.iban_documents')}</TabsTrigger>
            </TabsList>

            {Object.entries({
              id_documents: 'ID Documents',
              social_security: 'Social Security',
              cv: 'CV/Resume',
              iban_documents: 'IBAN Documents'
            }).map(([key, label]) => (
              <TabsContent key={key} value={key} className='mt-4'>
                {documents[key as keyof typeof documents] &&
                documents[key as keyof typeof documents].length > 0 ? (
                  <div className='space-y-6'>
                    {documents[key as keyof typeof documents].map((doc) => (
                      <div
                        key={doc.id}
                        className='overflow-hidden rounded-lg border'
                      >
                        <div className='bg-gray-50 p-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {doc.file_name}
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <a
                                href={doc.original_url}
                                download
                                className='flex items-center text-sm text-indigo-600 hover:underline'
                              >
                                <DownloadIcon className='mr-1 h-4 w-4' />{' '}
                                {t('common.download')}
                              </a>
                            </div>
                          </div>
                          <div className='text-muted-foreground mt-3 text-xs'>
                            {doc.mime_type} • {formatFileSize(doc.size)} •
                            {t('common.uploaded')} : {formatDate(doc.created_at)}
                          </div>

                          {/* Document Preview */}
                          <div className='mt-4 rounded border bg-white'>
                            {doc.mime_type === 'application/pdf' ? (
                              <iframe
                                src={doc.original_url}
                                className='h-[500px] w-full'
                                title={doc.file_name}
                              />
                            ) : doc.mime_type.startsWith('image/') ? (
                              <img
                                src={doc.original_url}
                                alt={doc.file_name}
                                className='max-h-[500px] w-full object-contain'
                              />
                            ) : (
                              <div className='flex h-[200px] items-center justify-center'>
                                <p className='text-gray-500'>
                                  {t('consultant.profile.error.preview_not_available')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='py-4 text-center text-gray-500'>
                    No {label.toLowerCase()}
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </CardContent>
    </div>
  );
}