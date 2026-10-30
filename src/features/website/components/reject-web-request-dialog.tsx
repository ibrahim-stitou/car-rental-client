'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RejectionCode, WebRequest } from '@/types/website.types';
import { useRejectWebRequest } from '../hooks/use-website';
import { REJECTION_CODES } from '../constants';
import { toastWebsiteError } from '../utils';

interface Props {
  request: WebRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectWebRequestDialog({ request, open, onOpenChange }: Props) {
  const [code, setCode] = useState<RejectionCode>('vehicle_unavailable');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const mutation = useRejectWebRequest(request.id);

  const submit = () => {
    mutation.mutate({ rejection_code: code, reason: reason.trim() || undefined, notify_client: notify }, {
      onSuccess: () => { toast.success('Demande refusée'); onOpenChange(false); },
      onError: (err) => toastWebsiteError(err, 'Refus impossible'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser la demande {request.reference}</DialogTitle>
          <DialogDescription>La demande sera close. Le motif reste visible dans l&apos;historique.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={code} onValueChange={(v) => setCode(v as RejectionCode)} className="grid grid-cols-2 gap-2">
            {REJECTION_CODES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value={c.value} />{c.label}
              </label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label>Précisions {code === 'other' ? '(obligatoire)' : '(facultatif)'}</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(c) => setNotify(!!c)} className="mt-0.5" />
            <span>
              Prévenir le client par e-mail
              <span className="block text-xs text-muted-foreground">Envoyé en {(request.locale ?? 'fr').toUpperCase()} à {request.email}.</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button variant="destructive" onClick={submit} disabled={mutation.isPending || (code === 'other' && !reason.trim())}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Refuser la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
