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
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_service', label: 'Out of Service' },
];

export const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const TRANSMISSION_OPTIONS: { value: Transmission; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

export const VEHICLE_CATEGORY_OPTIONS: { value: VehicleCategory; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'minivan', label: 'Minivan' },
];

export const RESERVATION_STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online' },
];

export const FUEL_LEVEL_OPTIONS: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarters', label: '3/4' },
  { value: 'full', label: 'Full' },
];

export const BILLING_TYPE_OPTIONS: { value: BillingDocumentType; label: string }[] = [
  { value: 'BC', label: 'BC - Purchase Order' },
  { value: 'BR', label: 'BR - Receipt Note' },
  { value: 'BL', label: 'BL - Delivery Note' },
  { value: 'DV', label: 'DV - Quote' },
  { value: 'FA', label: 'FA - Invoice' },
  { value: 'AV', label: 'AV - Credit Note' },
];

export const BILLING_STATUS_OPTIONS: { value: BillingStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const INSURANCE_TYPE_OPTIONS: { value: InsuranceType; label: string }[] = [
  { value: 'third_party', label: 'Third Party' },
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'all_risk', label: 'All Risk' },
];

export const MAINTENANCE_STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const MAINTENANCE_PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceType; label: string }[] = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'engine_service', label: 'Engine Service' },
  { value: 'transmission_service', label: 'Transmission Service' },
  { value: 'battery_replacement', label: 'Battery Replacement' },
  { value: 'body_repair', label: 'Body Repair' },
  { value: 'general_inspection', label: 'General Inspection' },
  { value: 'other', label: 'Other' },
];

export const INSPECTION_RESULT_OPTIONS: { value: InspectionResult; label: string }[] = [
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

export const VIGNETTE_PAYMENT_METHOD_OPTIONS: { value: VignettePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
];

export const DEFAULT_PAGE_SIZE = 15;
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];
