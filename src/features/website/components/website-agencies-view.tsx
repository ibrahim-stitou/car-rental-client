'use client';

import Link from 'next/link';
import { Building2, Car, MapPin, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { useWebsiteAgencies } from '../hooks/use-website';

export function WebsiteAgenciesView() {
  const { data: res, isLoading } = useWebsiteAgencies();
  const agencies = res?.data ?? [];

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <PageHeader title="Agences du site" description="Présentation, horaires, carte et points de livraison des agences" />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : agencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune agence accessible.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agencies.map((agency) => {
            const cover = agency.photos.find((p) => p.is_cover) ?? agency.photos[0];
            return (
              <Card key={agency.id} className="overflow-hidden">
                <div className="relative aspect-[16/7] bg-muted">
                  {cover
                    ? <img src={cover.thumb} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>}
                  <div className="absolute right-2 top-2">
                    {agency.show_on_website
                      ? <Badge className="bg-green-100 text-green-700 border-green-200">En ligne</Badge>
                      : <Badge variant="outline" className="bg-background">Hors ligne</Badge>}
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{agency.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{[agency.address, agency.city].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {agency.published_vehicles_count !== null && (
                      <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />{agency.published_vehicles_count} véhicule(s) en ligne</span>
                    )}
                    <span>{agency.pickup_points.length} point(s) de livraison</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fiche</span><span>{agency.checklist.score} %</span>
                    </div>
                    <Progress value={agency.checklist.score} className="h-1.5" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/website/agencies/${agency.id}`}><Pencil className="h-3.5 w-3.5 mr-1" />Gérer la présentation</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
