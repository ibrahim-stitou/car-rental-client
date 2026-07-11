/**
 * Maps dashboard path prefixes to the permission required to view them.
 * Checked by src/middleware.ts on every navigation; unmatched paths (or ones
 * without an entry here) are open to any authenticated user.
 */
export const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: '/dashboard', permission: 'view-dashboard' },
  { prefix: '/agencies', permission: 'view-agency' },
  { prefix: '/vehicles', permission: 'view-vehicle' },
  { prefix: '/clients', permission: 'view-client' },
  { prefix: '/reservations', permission: 'view-reservation' },
  { prefix: '/billing', permission: 'view-billing' },
  { prefix: '/expenses', permission: 'view-expense' },
  { prefix: '/insurances', permission: 'view-insurance' },
  { prefix: '/maintenances', permission: 'view-maintenance' },
  { prefix: '/claims', permission: 'view-claim' },
  { prefix: '/technical-inspections', permission: 'view-technical-inspection' },
  { prefix: '/vignettes', permission: 'view-vignette' },
  { prefix: '/users', permission: 'view-user' },
  { prefix: '/roles', permission: 'view-role' },
  { prefix: '/logs', permission: 'view-logs' },
  { prefix: '/settings', permission: 'manage-settings' },
  { prefix: '/website', permission: 'manage-website' },
];

export function permissionForPath(pathname: string): string | null {
  const match = ROUTE_PERMISSIONS
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match?.permission ?? null;
}
