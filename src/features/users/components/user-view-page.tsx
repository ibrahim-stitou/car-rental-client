'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import apiClient from '@/lib/api';
import {
  CalendarIcon, UserIcon, MapPinIcon, PhoneIcon, MailIcon,
  BriefcaseIcon, AlertTriangleIcon, FileTextIcon, DownloadIcon, Edit
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
import {useLanguage} from '@/context/LanguageContext';

interface Document {
  id: number;
  name: string;
  url: string;
  mime_type: string;
  size: number;
  collection_name: string;
  created_at: string;
}

export default function UserViewPage({ params }: { params: { userId: string } }) {
  const { t } = useLanguage();
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [userResponse, documentsResponse] = await Promise.all([
          apiClient.get(apiRoutes.admin.users.detail(params.userId)),
          apiClient.get(apiRoutes.admin.users.getMedia(params.userId)),
        ]);

        setUser(userResponse.data.data);

        // Group documents by collection_name
        const groupedDocs = documentsResponse.data.data.reduce((acc: Record<string, Document[]>, doc: Document) => {
          const collection = doc.collection_name;
          if (['id_documents', 'social_security', 'cv', 'iban_documents'].includes(collection)) {
            if (!acc[collection]) acc[collection] = [];
            acc[collection].push(doc);
          }
          return acc;
        }, {});

        setDocuments({
          id_documents: groupedDocs.id_documents || [],
          social_security: groupedDocs.social_security || [],
          cv: groupedDocs.cv || [],
          iban_documents: groupedDocs.iban_documents || []
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(t('admin.users.errors.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    if (params.userId !== 'new') {
      fetchData();
    } else {
      router.push('/admin/users/new');
    }
  }, [params.userId, router, t]);

  const formatDate = (dateString: string) => {
    if (!dateString) return t('admin.users.show.notSpecified');
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return t('admin.users.show.invalidDate');
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
        <Button onClick={() => router.back()}>{t('admin.users.show.back')}</Button>
      </div>
    );
  }

  if (!user) return null;
  return (
    <div className='flex flex-1 flex-col space-y-4 bg-gray-50 p-3'>
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{t('admin.users.show.title')}</h1>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' onClick={() => router.back()}>
            {t('admin.users.show.back')}
          </Button>
          <Button
            variant='default'
            onClick={() => router.push(`/admin/users/${params.userId}/edit`)}
          >
            <Edit className='mr-2 h-4 w-4' /> {t('admin.users.edit.title')}
          </Button>
        </div>
      </div>
      <CardHeader className='pb-0'>
        <div className='flex items-center space-x-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage
              src={user.avatar_url || ''}
              alt={`${user.prenom} ${user.nom}`}
            />
            <AvatarFallback className='bg-indigo-100 text-indigo-800'>
              {getInitials(user.prenom, user.nom)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className='text-2xl'>
              {user.prenom} {user.nom}
            </CardTitle>
            <CardDescription className='mt-1 flex items-center'>
              <Badge
                className={cn(
                  'mr-2 rounded-md px-2 py-1 text-white',
                  user.status === 'active' && 'bg-green-500',
                  user.status === 'inactive' && 'bg-red-500'
                )}
              >
                {t(`admin.users.statuses.${user.status}`)}
              </Badge>
              {user.role?.name && (
                <Badge variant='outline' className='bg-indigo-50'>
                  {user.role.name}
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6 pt-4'>
        {/* Personal Information Section */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <UserIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.show.personalInfo')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.show.name')}</h4>
              <p className='mt-1'>
                {user.prenom} {user.nom}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.email')}</h4>
              <p className='mt-1 flex items-center'>
                <MailIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.email || t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.phone')}
              </h4>
              <p className='mt-1 flex items-center'>
                <PhoneIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.telephone || t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.gender')}</h4>
              <p className='mt-1'>
                {user.sexe === 'M'
                  ? t('admin.users.genders.male')
                  : user.sexe === 'F'
                    ? t('admin.users.genders.female')
                    : user.sexe || t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.birthDate')}
              </h4>
              <p className='mt-1 flex items-center'>
                <CalendarIcon className='mr-1 h-4 w-4 text-gray-400' />
                {user.date_naissance
                  ? formatDate(user.date_naissance)
                  : t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.role')}</h4>
              <p className='mt-1'>{user.role?.name || t('admin.users.show.notAssigned')}</p>
            </div>
          </div>
        </section>

        {/* Address Section */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <MapPinIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.form.sections.address')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='md:col-span-3'>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.address')}
              </h4>
              <p className='mt-1'>{user.adresse || t('admin.users.show.notSpecified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.city')}</h4>
              <p className='mt-1'>{user.ville || t('admin.users.show.notSpecified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.postalCode')}</h4>
              <p className='mt-1'>{user.code_postal || t('admin.users.show.notSpecified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>{t('admin.users.fields.country')}</h4>
              <p className='mt-1'>{user.pays?.nom || t('admin.users.show.notSpecified')}</p>
            </div>
          </div>
        </section>

        {/* Professional Information */}
        <section className='rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium mb-4'>
            <BriefcaseIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.form.sections.professional')}
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              {user.numero_secu && (
                <div className='rounded-md bg-gray-50 p-3'>
                  <p className='text-sm font-medium text-gray-500 mb-1'>
                    {t('admin.users.form.fields.socialSecurity')}
                  </p>
                  <p className='text-gray-900 font-medium'>{user.numero_secu}</p>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              {user.bank_name && (
                <div className='rounded-md bg-gray-50 p-3'>
                  <p className='text-sm font-medium text-gray-500 mb-1'>{t('admin.users.fields.bankName')}</p>
                  <p className='text-gray-900 font-medium'>{user.bank_name}</p>
                </div>
              )}

              {user.iban && (
                <div className='rounded-md bg-gray-50 p-3'>
                  <p className='text-sm font-medium text-gray-500 mb-1'>{t('admin.users.fields.iban')}</p>
                  <p className='text-gray-900 font-medium'>{user.iban}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className='space-y-4 rounded-md border border-amber-300 bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <AlertTriangleIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.create.emergencyContact')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-4'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.emergencyName')}
              </h4>
              <p className='mt-1'>
                {user.emergency_fullname || t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.emergencyPhone')}
              </h4>
              <p className='mt-1'>{user.emergency_tel || t('admin.users.show.notSpecified')}</p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.fields.relationship')}
              </h4>
              <p className='mt-1'>
                {user.emergency_relation || t('admin.users.show.notSpecified')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.show.additionalInfo')}
              </h4>
              <p className='mt-1'>{user.additional_info || t('admin.users.show.notSpecified')}</p>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <UserIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.show.accountInfo')}
          </h3>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.table.created_at')}
              </h4>
              <p className='mt-1'>
                {user.created_at ? formatDate(user.created_at) : t('admin.users.show.unknown')}
              </p>
            </div>

            <div>
              <h4 className='text-sm font-medium text-gray-500'>
                {t('admin.users.table.updated_at')}
              </h4>
              <p className='mt-1'>
                {user.updated_at ? formatDate(user.updated_at) : t('admin.users.show.unknown')}
              </p>
            </div>
          </div>
        </section>
        <section className='space-y-4 rounded-md border bg-white p-4 shadow-sm'>
          <h3 className='flex items-center text-lg font-medium'>
            <FileTextIcon className='mr-2 h-5 w-5 text-indigo-600' />
            {t('admin.users.create.documents')}
          </h3>

          <Tabs defaultValue='id_documents' className='w-full'>
            <TabsList className='grid grid-cols-4'>
              <TabsTrigger value='id_documents'>{t('admin.users.show.idDocuments')}</TabsTrigger>
              <TabsTrigger value='social_security'>{t('admin.users.show.socialSecurity')}</TabsTrigger>
              <TabsTrigger value='cv'>{t('admin.users.show.cv')}</TabsTrigger>
              <TabsTrigger value='iban_documents'>{t('admin.users.show.ibanDocuments')}</TabsTrigger>
            </TabsList>

            {Object.entries({
              id_documents: t('admin.users.show.idDocuments'),
              social_security: t('admin.users.show.socialSecurity'),
              cv: t('admin.users.show.cv'),
              iban_documents: t('admin.users.show.ibanDocuments')
            }).map(([key, label]) => (
              <TabsContent key={key} value={key} className='mt-4'>
                {documents[key as keyof typeof documents].length > 0 ? (
                  <div className='space-y-6'>
                    {documents[key as keyof typeof documents].map((doc) => (
                      <div
                        key={doc.id}
                        className='overflow-hidden rounded-lg border'
                      >
                        <div className='bg-gray-50 p-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>{doc.name}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <a
                                href={doc.url}
                                download
                                className='flex items-center text-sm text-indigo-600 hover:underline'
                              >
                                <DownloadIcon className='mr-1 h-4 w-4' />{' '}
                                {t('admin.users.show.download')}
                              </a>
                            </div>
                          </div>
                          <div className='text-muted-foreground mt-3 text-xs'>
                            {doc.mime_type} • {formatFileSize(doc.size)} •
                            {t('admin.users.show.uploaded')}: {formatDate(doc.created_at)}
                          </div>

                          {/* Document Preview */}
                          <div className='mt-4 rounded border bg-white'>
                            {doc.mime_type === 'application/pdf' ? (
                              <iframe
                                src={doc.url}
                                className='h-[500px] w-full'
                                title={doc.name}
                              />
                            ) : doc.mime_type.startsWith('image/') ? (
                              <img
                                src={doc.url}
                                alt={doc.name}
                                className='max-h-[500px] w-full object-contain'
                              />
                            ) : (
                              <div className='flex h-[200px] items-center justify-center'>
                                <p className='text-gray-500'>
                                  {t('admin.users.show.previewNotAvailable')}
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
                    {t('admin.users.show.noDocumentsUploaded')}
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