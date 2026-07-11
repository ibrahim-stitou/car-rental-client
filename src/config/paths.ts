export const paths = {
  auth: {
    signIn: '/sign-in',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  dashboard: {
    root: '/dashboard',
  },
  agencies: {
    list: '/agencies',
    create: '/agencies/new',
    detail: (id: string) => `/agencies/${id}`,
    edit: (id: string) => `/agencies/${id}/edit`,
  },
  vehicles: {
    list: '/vehicles',
    create: '/vehicles/new',
    detail: (id: string) => `/vehicles/${id}`,
    edit: (id: string) => `/vehicles/${id}/edit`,
  },
  clients: {
    list: '/clients',
    create: '/clients/new',
    detail: (id: string) => `/clients/${id}`,
    edit: (id: string) => `/clients/${id}/edit`,
  },
  reservations: {
    list: '/reservations',
    create: '/reservations/create',
    detail: (id: string) => `/reservations/${id}`,
    edit: (id: string) => `/reservations/${id}/edit`,
    calendar: '/reservations/calendar',
  },
  billing: {
    list: '/billing',
    create: '/billing/new',
    detail: (id: string) => `/billing/${id}`,
    edit: (id: string) => `/billing/${id}/edit`,
  },
  insurances: {
    list: '/insurances',
    create: '/insurances/new',
    detail: (id: string) => `/insurances/${id}`,
    edit: (id: string) => `/insurances/${id}/edit`,
  },
  maintenances: {
    list: '/maintenances',
    create: '/maintenances/new',
    detail: (id: string) => `/maintenances/${id}`,
    edit: (id: string) => `/maintenances/${id}/edit`,
  },
  technicalInspections: {
    list: '/technical-inspections',
    create: '/technical-inspections/new',
    detail: (id: string) => `/technical-inspections/${id}`,
    edit: (id: string) => `/technical-inspections/${id}/edit`,
  },
  vignettes: {
    list: '/vignettes',
    create: '/vignettes/new',
    detail: (id: string) => `/vignettes/${id}`,
    edit: (id: string) => `/vignettes/${id}/edit`,
  },
  users: {
    list: '/users',
    create: '/users/new',
    detail: (id: string) => `/users/${id}`,
    edit: (id: string) => `/users/${id}/edit`,
  },
  roles: {
    list: '/roles',
  },
  notifications: {
    list: '/notifications',
  },
  logs: {
    list: '/logs',
  },
  profile: '/profile',
  security: '/security',
} as const;
