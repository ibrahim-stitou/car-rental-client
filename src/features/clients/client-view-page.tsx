'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Edit,
  Trash,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Building,
  Globe,
  CreditCard,
  Calendar,
  Briefcase,
  DollarSign,
  Flag, FileText
} from 'lucide-react';
import apiClient from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

interface Country {
  id: number;
  nom: string;
  code: string;
  indicatif_telephonique: string;
  devise: string;
  tva_standard: number;
  created_at: string | null;
  updated_at: string | null;
}

interface Client {
  id: number;
  name: string;
  capital: string;
  idnumber: string;
  address: string;
  phone: string;
  mail: string;
  country_id: number;
  code_postal: string;
  city: string;
  iban: string;
  bic: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  country: Country;
  reference_special:string | null;
}

export default function ClientViewPage({ params }: { params: { clientId: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/admin/clients/${params.clientId}`);
        if (response.data?.success) {
          setClient(response.data.data);
        } else {
          setError(t('admin.clients.show.failedToLoad') || 'Failed to fetch client details.');
        }
      } catch (err) {
        setError(t('admin.clients.show.errorLoading') || 'An error occurred while fetching client details.');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params.clientId, t]);

  const handleEdit = () => {
    router.push(`/admin/clients/${params.clientId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm(t('admin.clients.deleteModal.description') || 'Are you sure you want to delete this client?')) {
      try {
        await apiClient.delete(`/admin/clients/${params.clientId}`);
        router.push('/admin/clients');
      } catch (err) {
        setError(t('admin.clients.delete.error') || 'An error occurred while deleting the client.');
      }
    }
  };

  if (loading) {
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
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error') || 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            {t('common.goBack') || 'Go Back'}
          </Button>
        </Alert>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 text-xl">{t('admin.clients.show.notFound') || 'Client not found'}</div>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {t('common.goBack') || 'Go Back'}
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: client.country?.devise || 'MAD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-full p-6'>
        {/* Header with Actions */}
        <div className='mb-6 flex flex-col md:flex-row md:items-center md:justify-between'>
          <div className='mb-4 flex items-center md:mb-0'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {t('admin.clients.show.title') || 'Client Profile'}
            </h1>
          </div>

          <div className='flex space-x-2'>
            <Button variant='outline' onClick={() => router.back()}>
              {t('admin.clients.show.back') || 'Back'}
            </Button>
            <Button
              variant='default'
              onClick={() => router.push(`/admin/clients/${params.clientId}/edit`)}
            >
              <Edit className='mr-2 h-4 w-4' /> {t('admin.clients.show.edit') || 'Edit Client'}
            </Button>
          </div>
        </div>

        {/* Client Overview Card */}
        <Card className='mb-6 overflow-hidden'>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row'>
              {/* Profile Summary */}
              <div className='flex flex-col items-center border-b p-4 text-center md:w-1/4 md:border-r md:border-b-0 '>
                <h2 className='mb-1 text-2xl font-bold mt-14'>{client.name}</h2>
                <p className='mb-3 text-gray-500'>{client.mail}</p>

                <div className='flex items-center justify-center'>
                  {client.status === 'active' ? (
                    <Badge className='bg-green-100 text-green-800'>
                      <CheckCircle className='mr-1 h-3 w-3' />
                      {t('admin.clients.status.active') || 'Active'}
                    </Badge>
                  ) : (
                    <Badge className='bg-red-100 text-red-800'>
                      <XCircle className='mr-1 h-3 w-3' />
                      {t('admin.clients.status.inactive') || 'Inactive'}
                    </Badge>
                  )}
                </div>

                <div className='mt-4'>
                  <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-200'>
                    {client.idnumber}
                  </Badge>
                </div>
              </div>

              {/* Main Client Details */}
              <div className='p-4 pl-6 md:w-3/4'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                  {/* Contact Information */}
                  <div className='col-span-3'>
                    <h3 className='mb-4 text-lg font-medium'>{t('admin.clients.show.contactInfo') || 'Contact Information'}</h3>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <div className='flex items-center'>
                        <Mail className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.show.email') || 'Email'}</p>
                          <p className='font-medium'>{client.mail}</p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <Phone className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.show.phone') || 'Phone'}</p>
                          <p className='font-medium'>{client.phone}</p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <MapPin className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.show.address') || 'Address'}</p>
                          <p className='font-medium'>
                            {client.address}, {client.city}, {client.code_postal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className='col-span-3 my-2' />

                  {/* Company Information */}
                  <div className='col-span-3'>
                    <h3 className='mb-4 text-lg font-medium'>{t('admin.clients.show.clientInfo') || 'Client Information'}</h3>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <div className='flex items-center'>
                        <Building className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.show.name') || 'Name'}</p>
                          <p className='font-medium'>{client.name}</p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <DollarSign className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.form.capital') || 'Capital'}</p>
                          <p className='font-medium'>{client.capital ? formatCurrency(client.capital) : 'N/A'}</p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <Flag className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.show.country') || 'Country'}</p>
                          <p className='font-medium'>{client.country?.nom || 'N/A'}</p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        <FileText className='mr-2 h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>{t('admin.clients.form.reference_special') || 'Référence spécial'}</p>
                          <p className='font-medium'>{client.reference_special|| 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {/* Banking Information */}
          {/*<Card>*/}
          {/*  <CardHeader className='pb-2'>*/}
          {/*    <CardTitle className='flex items-center'>*/}
          {/*      <CreditCard className='mr-2 h-5 w-5 text-blue-500' />*/}
          {/*      {t('admin.clients.form.bankingInfoTitle') || 'Banking Information'}*/}
          {/*    </CardTitle>*/}
          {/*  </CardHeader>*/}
          {/*  <CardContent className='pt-4'>*/}
          {/*    <div className='space-y-6'>*/}
          {/*      <div className='flex flex-col'>*/}
          {/*        <div className='mb-2 flex items-center'>*/}
          {/*          <p className='text-sm font-medium text-gray-500'>{t('admin.clients.form.iban') || 'IBAN'}</p>*/}
          {/*        </div>*/}
          {/*        <div className='rounded-md bg-gray-50 p-3 font-mono text-sm'>*/}
          {/*          {client.iban || 'N/A'}*/}
          {/*        </div>*/}
          {/*      </div>*/}

          {/*      <div className='flex flex-col'>*/}
          {/*        <div className='mb-2 flex items-center'>*/}
          {/*          <p className='text-sm font-medium text-gray-500'>{t('admin.clients.form.bic') || 'BIC'}</p>*/}
          {/*        </div>*/}
          {/*        <div className='rounded-md bg-gray-50 p-3 font-mono text-sm'>*/}
          {/*          {client.bic || 'N/A'}*/}
          {/*        </div>*/}
          {/*      </div>*/}

          {/*      <div className='flex items-start'>*/}
          {/*        <Globe className='mt-0.5 mr-2 h-5 w-5 text-gray-400' />*/}
          {/*        <div>*/}
          {/*          <p className='text-sm font-medium text-gray-500'>{t('admin.clients.show.country') || 'Country'}</p>*/}
          {/*          <p>{client.country?.nom || 'N/A'}</p>*/}
          {/*          <p className='text-sm text-gray-500'>*/}
          {/*            {t('admin.clients.show.currency') || 'Currency'}: {client.country?.devise || 'N/A'}*/}
          {/*          </p>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}

          {/* System Information */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center'>
                <Clock className='mr-2 h-5 w-5 text-blue-500' />
                {t('admin.clients.show.systemInfo') || 'System Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-4'>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-start'>
                    <Calendar className='mt-0.5 mr-2 h-5 w-5 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-500'>{t('admin.clients.show.createdAt') || 'Created At'}</p>
                      <p>{formatDate(client.created_at)}</p>
                    </div>
                  </div>

                  <div className='flex items-start'>
                    <Clock className='mt-0.5 mr-2 h-5 w-5 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-500'>{t('admin.clients.show.updatedAt') || 'Updated At'}</p>
                      <p>{formatDate(client.updated_at)}</p>
                    </div>
                  </div>

                  <div className='flex items-start'>
                    <Briefcase className='mt-0.5 mr-2 h-5 w-5 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-500'>{t('admin.clients.show.status') || 'Status'}</p>
                      <p>
                        {client.status === 'active'
                          ? t('admin.clients.status.active') || 'Active'
                          : t('admin.clients.status.inactive') || 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                {client.deleted_at && (
                  <div className='mt-4 rounded-md border border-red-200 bg-red-50 p-3'>
                    <p className='flex items-center text-sm text-red-600'>
                      <AlertCircle className='mr-2 h-4 w-4' />
                      {t('admin.clients.show.deletedAt') || 'Deleted At'}: {formatDate(client.deleted_at)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}