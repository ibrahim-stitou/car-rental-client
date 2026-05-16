'use client';

import React, { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMissionsStore } from '@/stores/consultant/missions-store';
import { useLanguage } from '@/context/LanguageContext';
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  CreditCard,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: number;
  name: string;
  capital: string;
  idNumber: string;
  address: string;
  phone: string;
  email: string;
  countryId: number;
  postalCode: string;
  city: string;
  iban: string;
  bic: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Country {
  id: number;
  name: string;
  code: string;
  phoneCode: string;
  currency: string;
  standardVat: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Mission {
  id: number;
  title: string;
  clientId: number;
  userId: number;
  status: 'pending' | 'active' | 'inactive' | 'completed' | 'canceled';
  dailyRate: string;
  rateType: 'daily' | 'hourly';
  startDate: string;
  endDate: string;
  description: string;
  countryId: number;
  mainAddress: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  client: Client;
  country: Country;
  tjm?: string;
  tjm_type?: 'daily' | 'hourly';
  date_debut?: string;
  date_fin?: string;
  adresse_prin?: string;
}

export const MissionsCards: React.FC = () => {
  const { missions, fetchMissions } = useMissionsStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const loadMissions = async () => {
      await fetchMissions();
      setIsLoading(false);
    };
    loadMissions();
  }, [fetchMissions]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateRemainingTime = (
    startDate: string,
    endDate: string
  ): string => {
    const now = new Date();
    const end = new Date(endDate);

    if (now > end) return t('consultant.missions.completed');

    const remainingDays = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${remainingDays} ${t('consultant.missions.daysRemaining')}`;
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className='bg-green-500 text-white'>{t('consultant.missions.status.active')}</Badge>;
      case 'inactive':
        return <Badge className='bg-gray-500 text-white'>{t('consultant.missions.status.inactive')}</Badge>;
      case 'pending':
        return <Badge className='bg-yellow-500 text-white'>{t('consultant.missions.status.pending')}</Badge>;
      case 'completed':
        return <Badge className='bg-blue-500 text-white'>{t('consultant.missions.status.completed')}</Badge>;
      case 'canceled':
        return <Badge className='bg-red-500 text-white'>{t('consultant.missions.status.canceled')}</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className='grid w-full grid-cols-1 gap-6 sm:grid-cols-2'>
        {[1, 2].map((i) => (
          <Card key={i} className='w-full'>
            <CardHeader>
              <Skeleton className='mb-2 h-6 w-3/4' />
              <Skeleton className='h-4 w-1/4' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className='h-4 w-full' />
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className='h-9 w-full' />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  const activeMissions = missions.filter(mission =>
    mission.status === 'active' || mission.status === 'pending'
  );

  const inactiveMissions = missions.filter(mission =>
    mission.status === 'inactive' || mission.status === 'completed' || mission.status === 'canceled'
  );

  const MissionCard = ({
                         //@ts-ignore
                         mission, isInactive = false }) => (
    <Card
      key={mission.id}
      className={`w-full transition-all duration-300 hover:shadow-lg ${
        isInactive ? 'opacity-70 bg-gray-50' : ''
      }`}
    >
      <CardHeader>
        <div className='flex items-start justify-between'>
          <h2 className={`text-xl font-semibold ${isInactive ? 'text-gray-700' : 'text-gray-900'}`}>
            {mission.title}
          </h2>
          {getStatusBadge(mission.status)}
        </div>
      </CardHeader>

      <CardContent>
        <div className='grid grid-cols-1 gap-4'>
          <div className='flex items-center text-gray-700'>
            <Building2 className={`mr-2 h-4 w-4 ${isInactive ? 'text-gray-500' : 'text-primary'}`} />
            <span className='font-medium'>{mission.client.name}</span>
          </div>
          <div className='flex items-center text-gray-700'>
            <CreditCard className={`mr-2 h-4 w-4 ${isInactive ? 'text-gray-500' : 'text-primary'}`} />
            <span>
              {parseFloat(mission.tjm || mission.dailyRate).toLocaleString('en-US')}{' '}
              € / {(mission.tjm_type) === 'journalier'
              ? t('consultant.missions.perDay')
              : t('consultant.missions.fixed')}
            </span>
          </div>
          <div className='flex items-center text-gray-700'>
            <Clock className={`mr-2 h-4 w-4 ${isInactive ? 'text-gray-500' : 'text-primary'}`} />
            <span>
              {calculateRemainingTime(
                mission.date_debut || mission.startDate,
                mission.date_fin || mission.endDate
              )}
            </span>
          </div>
          <div className='flex items-center text-gray-700'>
            <MapPin className={`mr-2 h-4 w-4 ${isInactive ? 'text-gray-500' : 'text-primary'}`} />
            <span>
              {`${mission.adresse_prin || mission.mainAddress || mission.client.address}, ${mission.country.name || mission.country.nom}`}
            </span>
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter>
        <Button
          className={`w-full cursor-pointer ${
            isInactive ? 'bg-gray-400 hover:bg-gray-500' : 'bg-primary hover:bg-primary/90'
          }`}
          onClick={() =>
            router.push(`/consultant/missions/${mission.id}/show`)
          }
        >
          <Eye className='mr-2 h-4 w-4' /> {t('consultant.missions.viewDetails')}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className='w-full'>
      {activeMissions.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">{t('consultant.missions.activeMissions')}</h2>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8'>
            {activeMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </>
      )}
      {inactiveMissions.length > 0 && (
        <>
          {activeMissions.length > 0 && (
            <div className="relative my-8">
              <Separator className="my-8 border-gray-300" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500">
                {t('consultant.missions.inactiveMissions')}
              </span>
            </div>
          )}

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            {inactiveMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} isInactive={true} />
            ))}
          </div>
        </>
      )}

      {missions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">{t('consultant.missions.noMissionsFound')}</p>
        </div>
      )}
    </div>
  );
};