import type {
  ExtraPricing,
  Locale,
  PickupPointType,
  RejectionCode,
  VehicleFeature,
  WebRequestEventType,
  WebRequestStatus,
  WeekDay,
} from '@/types/website.types';

export const LOCALES: { value: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { value: 'fr', label: 'Français', dir: 'ltr' },
  { value: 'ar', label: 'العربية', dir: 'rtl' },
  { value: 'en', label: 'English', dir: 'ltr' },
];

/** Délai de premier contact promis au client (« sous 2 h ouvrées »). */
export const RESPONSE_DELAY_MINUTES = 120;

export const REQUEST_STATUS: Record<WebRequestStatus, { label: string; color: string }> = {
  new:              { label: 'Nouvelle',          color: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted:        { label: 'Contactée',         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  awaiting_payment: { label: 'Attente paiement',  color: 'bg-purple-100 text-purple-700 border-purple-200' },
  converted:        { label: 'Convertie',         color: 'bg-green-100 text-green-700 border-green-200' },
  rejected:         { label: 'Refusée',           color: 'bg-red-100 text-red-700 border-red-200' },
  cancelled:        { label: 'Annulée',           color: 'bg-gray-100 text-gray-700 border-gray-200' },
  expired:          { label: 'Expirée',           color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export const REQUEST_TABS: { value: string; label: string; params: Record<string, string> }[] = [
  { value: 'open',      label: 'À traiter',  params: { open: '1' } },
  { value: 'new',       label: 'Nouvelles',  params: { status: 'new' } },
  { value: 'contacted', label: 'Contactées', params: { status: 'contacted' } },
  { value: 'converted', label: 'Converties', params: { status: 'converted' } },
  { value: 'rejected',  label: 'Refusées',   params: { status: 'rejected' } },
  { value: 'closed',    label: 'Annulées / expirées', params: { 'status[0]': 'cancelled', 'status[1]': 'expired' } },
  { value: 'all',       label: 'Toutes',     params: {} },
];

export const EVENT_TYPES: { value: WebRequestEventType; label: string }[] = [
  { value: 'call',     label: 'Appel' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'E-mail' },
  { value: 'note',     label: 'Note interne' },
];

/** Notifications envoyées (outcome des évènements notification_sent, suffixe _failed en cas d'échec). */
export const NOTIFICATION_LABELS: Record<string, string> = {
  client_received:   'E-mail « demande reçue » envoyé au client',
  client_accepted:   'E-mail « demande acceptée » envoyé au client',
  client_rejected:   'E-mail « demande refusée » envoyé au client',
  staff_new_request: "Équipe de l'agence prévenue de la nouvelle demande",
  staff_cancelled:   "Équipe de l'agence prévenue de l'annulation",
};

export const CALL_OUTCOMES: { value: string; label: string }[] = [
  { value: 'reached',     label: 'Joint' },
  { value: 'no_answer',   label: 'Pas de réponse' },
  { value: 'voicemail',   label: 'Messagerie' },
  { value: 'callback',    label: 'À rappeler' },
  { value: 'wrong_number', label: 'Mauvais numéro' },
];

export const REJECTION_CODES: { value: RejectionCode; label: string }[] = [
  { value: 'vehicle_unavailable', label: 'Véhicule indisponible' },
  { value: 'incomplete_file',     label: 'Dossier incomplet' },
  { value: 'client_unreachable',  label: 'Client injoignable' },
  { value: 'client_declined',     label: 'Le client a renoncé' },
  { value: 'duplicate',           label: 'Doublon' },
  { value: 'other',               label: 'Autre motif' },
];

export const VEHICLE_FEATURES: { value: VehicleFeature; label: string }[] = [
  { value: 'gps',             label: 'GPS' },
  { value: 'bluetooth',       label: 'Bluetooth' },
  { value: 'carplay',         label: 'Apple CarPlay' },
  { value: 'android_auto',    label: 'Android Auto' },
  { value: 'usb',             label: 'Prise USB' },
  { value: 'rear_camera',     label: 'Caméra de recul' },
  { value: 'parking_sensors', label: 'Radars de stationnement' },
  { value: 'cruise_control',  label: 'Régulateur de vitesse' },
  { value: 'heated_seats',    label: 'Sièges chauffants' },
  { value: 'sunroof',         label: 'Toit ouvrant' },
  { value: 'keyless',         label: 'Démarrage sans clé' },
  { value: 'isofix',          label: 'Fixations ISOFIX' },
  { value: 'abs',             label: 'ABS' },
  { value: 'airbags',         label: 'Airbags' },
];

/** Services d'agence proposés ; d'autres codes libres restent possibles. */
export const AGENCY_SERVICES: { value: string; label: string }[] = [
  { value: 'airport_delivery', label: 'Livraison aéroport' },
  { value: 'hotel_delivery',   label: 'Livraison hôtel' },
  { value: 'home_delivery',    label: 'Livraison à domicile' },
  { value: 'one_way',          label: 'Retour dans une autre agence' },
  { value: 'open_24_7',        label: 'Ouvert 24 h/24' },
  { value: 'parking',          label: 'Parking' },
  { value: 'card_payment',     label: 'Paiement par carte' },
];

export const PICKUP_POINT_TYPES: { value: PickupPointType; label: string }[] = [
  { value: 'airport',       label: 'Aéroport' },
  { value: 'train_station', label: 'Gare' },
  { value: 'hotel',         label: 'Hôtel' },
  { value: 'address',       label: 'Adresse' },
  { value: 'other',         label: 'Autre' },
];

export const WEEK_DAYS: { value: WeekDay; label: string }[] = [
  { value: 'monday',    label: 'Lundi' },
  { value: 'tuesday',   label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday',  label: 'Jeudi' },
  { value: 'friday',    label: 'Vendredi' },
  { value: 'saturday',  label: 'Samedi' },
  { value: 'sunday',    label: 'Dimanche' },
];

export const EXTRA_PRICING: { value: ExtraPricing; label: string }[] = [
  { value: 'per_day',    label: 'Par jour' },
  { value: 'per_rental', label: 'Par location' },
];

/** Codes de la checklist de publication renvoyés par l'API (missing[] et errors.checklist). */
export const CHECKLIST_LABELS: Record<string, string> = {
  active:                  'Fiche active (véhicule ou agence en service)',
  agency_published:        "Agence publiée sur le site",
  photos:                  'Photos en nombre suffisant (véhicule : 4, agence : 1)',
  cover:                   'Photo de couverture choisie',
  slug:                    'Adresse de la page (slug)',
  specs:                   'Caractéristiques (catégorie, boîte, carburant, places)',
  doors:                   'Nombre de portes',
  luggage:                 'Capacité bagages',
  price:                   'Prix web ≥ 50 MAD / jour',
  deposit:                 'Caution renseignée',
  title_fr:                'Titre en français',
  title_ar:                'Titre en arabe',
  title_en:                'Titre en anglais',
  short_description_fr:    'Accroche en français',
  short_description_ar:    'Accroche en arabe',
  short_description_en:    'Accroche en anglais',
  address:                 'Adresse et ville',
  phone:                   'Téléphone',
  coordinates:             'Position sur la carte',
  opening_hours:           "Horaires d'ouverture",
  description_fr:          'Description en français',
  description_ar:          'Description en arabe',
  description_en:          'Description en anglais',
};

export function checklistLabel(code: string) {
  return CHECKLIST_LABELS[code] ?? code;
}
