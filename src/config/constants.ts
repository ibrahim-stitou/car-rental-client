import type {
  VehicleStatus,
  FuelType,
  Transmission,
  VehicleCategory,
} from '@/types/vehicle.types';
import type { ReservationStatus, PaymentStatus, PaymentMethod, FuelLevel } from '@/types/reservation.types';
import type { BillingDocumentType, BillingStatus } from '@/types/billing.types';
import type { InsuranceType } from '@/types/insurance.types';
import type { MaintenanceStatus, MaintenancePriority, MaintenanceType } from '@/types/maintenance.types';
import type { InspectionResult } from '@/types/technical-inspection.types';
import type { VignettePaymentMethod } from '@/types/vignette.types';
import type { UserRole } from '@/types/auth.types';

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'rented', label: 'Loué' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'out_of_service', label: 'Hors service' },
];

export const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: 'gasoline', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Électrique' },
  { value: 'hybrid', label: 'Hybride' },
];

export const TRANSMISSION_OPTIONS: { value: Transmission; label: string }[] = [
  { value: 'manual', label: 'Manuelle' },
  { value: 'automatic', label: 'Automatique' },
];

export const VEHICLE_CATEGORY_OPTIONS: { value: VehicleCategory; label: string }[] = [
  { value: 'sedan', label: 'Berline' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Fourgonnette' },
  { value: 'truck', label: 'Camion' },
  { value: 'convertible', label: 'Cabriolet' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'hatchback', label: 'Citadine' },
  { value: 'minivan', label: 'Monospace' },
];

export const RESERVATION_STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'no_show', label: 'Non présenté' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
  { value: 'paid', label: 'Payé' },
  { value: 'refunded', label: 'Remboursé' },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'online', label: 'Paiement en ligne' },
];

export const FUEL_LEVEL_OPTIONS: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'Vide' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarters', label: '3/4' },
  { value: 'full', label: 'Plein' },
];

export const BILLING_TYPE_OPTIONS: { value: BillingDocumentType; label: string }[] = [
  { value: 'BC', label: 'BC — Bon de Commande' },
  { value: 'BR', label: 'BR — Bon de Réception' },
  { value: 'BL', label: 'BL — Bon de Livraison' },
  { value: 'DV', label: 'DV — Devis' },
  { value: 'FA', label: 'FA — Facture' },
  { value: 'AV', label: 'AV — Avoir' },
];

export const BILLING_STATUS_OPTIONS: { value: BillingStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'paid', label: 'Payé' },
  { value: 'cancelled', label: 'Annulé' },
];

export const INSURANCE_TYPE_OPTIONS: { value: InsuranceType; label: string }[] = [
  { value: 'third_party', label: 'Responsabilité civile' },
  { value: 'comprehensive', label: 'Tous risques' },
  { value: 'all_risk', label: 'Tous risques étendu' },
];

export const MAINTENANCE_STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: 'scheduled', label: 'Planifiée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

export const MAINTENANCE_PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Élevée' },
  { value: 'urgent', label: 'Urgente' },
];

export const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceType; label: string }[] = [
  { value: 'oil_change', label: 'Vidange' },
  { value: 'tire_rotation', label: 'Rotation des pneus' },
  { value: 'brake_service', label: 'Révision des freins' },
  { value: 'engine_service', label: 'Révision moteur' },
  { value: 'transmission_service', label: 'Révision transmission' },
  { value: 'battery_replacement', label: 'Remplacement batterie' },
  { value: 'body_repair', label: 'Carrosserie' },
  { value: 'general_inspection', label: 'Inspection générale' },
  { value: 'other', label: 'Autre' },
];

export const INSPECTION_RESULT_OPTIONS: { value: InspectionResult; label: string }[] = [
  { value: 'passed', label: 'Réussi' },
  { value: 'failed', label: 'Échoué' },
  { value: 'pending', label: 'En attente' },
];

export const VIGNETTE_PAYMENT_METHOD_OPTIONS: { value: VignettePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'online', label: 'En ligne' },
];

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super-admin', label: 'Super Administrateur' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Observateur' },
];

export const DEFAULT_PAGE_SIZE = 15;
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];
