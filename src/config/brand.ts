export const APP_NAME = 'MyFleet-Control';
export const APP_TAGLINE = 'Plateforme de gestion de flotte 2026';
export const APP_DESCRIPTION = 'MyFleet-Control Fleet & Operations Management System';

/** Marketing landing page (public website), distinct from this management application. */
export const WEBSITE_DOMAIN = 'myfleet-control.com';
export const WEBSITE_URL = 'https://myfleet-control.com';

export interface ContactEmail {
  label: string;
  email: string;
}

export const CONTACT_EMAILS: ContactEmail[] = [
  { label: 'Support', email: 'support@myfleet-control.com' },
  { label: 'Marketing', email: 'marketing@myfleet-control.com' },
  { label: 'Ibrahim', email: 'ibrahim@myfleet-control.com' },
];
