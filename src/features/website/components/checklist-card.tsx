'use client';

import { CheckCircle2, CircleAlert, ExternalLink, Globe, GlobeLock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Checklist } from '@/types/website.types';
import { checklistLabel } from '../constants';

interface Props {
  checklist: Checklist;
  published: boolean;
  publicUrl?: string | null;
  onPublish: (publish: boolean) => void;
  isPending?: boolean;
  /** Message affiché quand la fiche ne peut pas encore être publiée. */
  blockedHint?: string;
}

export function ChecklistCard({ checklist, published, publicUrl, onPublish, isPending, blockedHint }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Publication</span>
          {published
            ? <Badge className="bg-green-100 text-green-700 border-green-200">En ligne</Badge>
            : <Badge variant="outline">Hors ligne</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fiche complète à</span>
            <span className="font-semibold">{checklist.score} %</span>
          </div>
          <Progress value={checklist.score} className="h-2" />
        </div>

        {checklist.missing.length > 0 ? (
          <ul className="space-y-1.5">
            {checklist.missing.map((code) => (
              <li key={code} className="flex items-start gap-2 text-sm text-amber-700">
                <CircleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                {checklistLabel(code)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />Tout est prêt pour le site.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {published ? (
            <Button variant="outline" onClick={() => onPublish(false)} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <GlobeLock className="h-4 w-4 mr-1.5" />}
              Retirer du site
            </Button>
          ) : (
            <Button onClick={() => onPublish(true)} disabled={isPending || !checklist.complete}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Globe className="h-4 w-4 mr-1.5" />}
              Publier sur le site
            </Button>
          )}
          {!published && !checklist.complete && (
            <p className="text-xs text-muted-foreground">{blockedHint ?? 'Complétez les points ci-dessus pour pouvoir publier.'}</p>
          )}
          {published && publicUrl && (
            <Button variant="link" size="sm" asChild className="h-auto p-0 justify-start">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />Voir la page publique
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
