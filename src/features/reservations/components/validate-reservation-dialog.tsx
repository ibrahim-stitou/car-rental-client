'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Stamp } from 'lucide-react';
import Link from 'next/link';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  hasSignature?: boolean;
  hasStamp?: boolean;
}

export function ValidateReservationDialog({ open, onOpenChange, onConfirm, loading, hasSignature = true, hasStamp = true }: Props) {
  const missingAssets = !hasSignature || !hasStamp;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Stamp className="h-5 w-5" />
            Valider la réservation ?
          </DialogTitle>
          <DialogDescription>
            Une fois validée, le cachet et la signature de votre compte seront ajoutés au contrat de
            location, qui deviendra alors définitif et non modifiable. Merci de vérifier toutes les
            informations avant de continuer.
          </DialogDescription>
        </DialogHeader>

        {missingAssets && (
          <Alert className="border-amber-200 bg-amber-50">
            <IconAlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Votre {!hasSignature && !hasStamp ? 'signature et votre cachet ne sont pas configurés' : !hasSignature ? 'signature n\'est pas configurée' : 'cachet n\'est pas configuré'}.
              Le contrat sera généré sans, sauf si vous les ajoutez d'abord dans votre{' '}
              <Link href="/profile" className="underline font-medium">profil</Link>.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Validation…' : 'Confirmer la validation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
