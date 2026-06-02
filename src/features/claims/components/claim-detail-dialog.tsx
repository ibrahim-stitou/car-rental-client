'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DocumentsSection } from '@/components/shared/documents-section';
import type { Claim } from '@/types/claim.types';
import { CLAIM_STATUS_OPTIONS, ACCIDENT_TYPE_OPTIONS } from '@/config/constants';
import { apiRoutes } from '@/config/apiRoutes';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit, AlertTriangle } from 'lucide-react';
import { IconShield, IconCurrencyDirham, IconUser } from '@tabler/icons-react';

function fmt(n: number | undefined) { return (n ?? 0).toLocaleString('fr-MA'); }
function fdate(d: string | undefined | null) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim;
  onEdit?: (claim: Claim) => void;
}

export function ClaimDetailDialog({ open, onOpenChange, claim, onEdit }: Props) {
  const statusOpt = CLAIM_STATUS_OPTIONS.find(o => o.value === claim.status);
  const typeOpt = ACCIDENT_TYPE_OPTIONS.find(o => o.value === claim.accident_type);

  const netLoss = (claim.total_damage_amount ?? 0)
    - (claim.insurance_amount_recovered ?? 0)
    - (claim.client_paid_amount ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {claim.claim_number}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${statusOpt?.color ?? ''}`}>{statusOpt?.label ?? claim.status}</Badge>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(claim)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Vehicle + Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Véhicule</p>
              <p className="font-semibold">{claim.vehicle?.brand} {claim.vehicle?.model}</p>
              <p className="text-sm text-muted-foreground font-mono">{claim.vehicle?.registration_number}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Client impliqué</p>
              {claim.client ? (
                <>
                  <p className="font-semibold flex items-center gap-1">
                    <IconUser className="h-4 w-4" />{claim.client.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{claim.client.phone}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucun client associé (équipe)</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Accident info */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{fdate(claim.claim_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-0.5">{typeOpt?.label ?? claim.accident_type}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsabilité</p>
              <Badge variant="outline" className={`mt-0.5 ${claim.is_client_responsible ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {claim.is_client_responsible ? 'Client responsable' : 'Équipe / Autre'}
              </Badge>
            </div>
          </div>

          {claim.title && <p className="font-semibold text-base">{claim.title}</p>}
          {claim.description && <p className="text-sm text-muted-foreground">{claim.description}</p>}
          {claim.responsible_notes && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
              <strong>Circonstances : </strong>{claim.responsible_notes}
            </div>
          )}

          <Separator />

          {/* Financials */}
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <IconCurrencyDirham className="h-4 w-4" />Détail financier
            </p>
            <div className="space-y-2">
              {[
                { label: 'Montant total des dégâts', value: claim.total_damage_amount, cls: 'text-red-600' },
                { label: 'Remboursement assurance', value: claim.insurance_amount_recovered, cls: 'text-green-600' },
                { label: 'Payé par le client', value: claim.client_paid_amount, cls: 'text-green-600' },
                { label: 'Charge entreprise', value: claim.company_expense_amount, cls: 'text-orange-600' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${cls}`}>{fmt(Number(value))} MAD</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 bg-muted/30 rounded px-2">
                <span className="font-semibold">Perte nette entreprise</span>
                <span className={`font-bold text-lg ${netLoss > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {fmt(netLoss)} MAD
                </span>
              </div>
            </div>
          </div>

          {/* Insurance */}
          {(claim.insurance_reference || claim.insurance_claim_date) && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <IconShield className="h-4 w-4" />Assurance
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {claim.insurance_reference && (
                    <div><p className="text-xs text-muted-foreground">Référence</p><p className="font-mono font-medium">{claim.insurance_reference}</p></div>
                  )}
                  {claim.insurance_claim_date && (
                    <div><p className="text-xs text-muted-foreground">Date déclaration</p><p className="font-medium">{fdate(claim.insurance_claim_date)}</p></div>
                  )}
                  {claim.settlement_date && (
                    <div><p className="text-xs text-muted-foreground">Règlement</p><p className="font-medium">{fdate(claim.settlement_date)}</p></div>
                  )}
                </div>
              </div>
            </>
          )}

          {claim.agent_notes && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes agent</p>
              <p>{claim.agent_notes}</p>
            </div>
          )}

          <Separator />

          {/* Documents */}
          <div className="grid grid-cols-1 gap-3">
            <DocumentsSection
              title="Photos / Documents du sinistre"
              entityId={claim.id}
              uploadUrl={apiRoutes.claims.uploadDocs(claim.id)}
              deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
              initialDocuments={[...claim.photos, ...claim.documents]}
              compact
            />
            <DocumentsSection
              title="Documents assurance"
              entityId={claim.id}
              uploadUrl={apiRoutes.claims.uploadInsuranceDocs(claim.id)}
              deleteUrlFn={(mid) => apiRoutes.claims.deleteMedia(claim.id, mid)}
              initialDocuments={claim.insurance_documents}
              compact
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
