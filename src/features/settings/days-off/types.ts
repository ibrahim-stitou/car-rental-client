export interface DayOff {
  id: number;
  countryId: number;
  dateStart: string;
  dateEnd: string;
  name: string;
  isRecurring: boolean;
}

export interface Country {
  id: number;
  nom: string;               // Correspond à 'name' dans l'ancienne interface
  code: string;              // Le code du pays (2 caractères)
  indicatif_telephonique?: string;  // Le préfixe téléphonique
  devise?: string;           // La devise du pays
  tva_standard?: number;     // Taux de TVA standard
  created_at?: string;       // Date de création
  updated_at?: string;       // Date de mise à jour
}