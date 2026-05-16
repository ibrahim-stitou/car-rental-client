import { NavItem } from 'types';
import { IconCalendarDollar } from '@tabler/icons-react';
import { PATHS } from '@/config/paths';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

// Main export (keep for backward compatibility)
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/admin/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Missions',
    url: '/admin/missions',
    icon: 'briefcase',
    shortcut: ['m', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'Contracts',
    url: '/admin/contracts',
    icon: 'page',
    shortcut: ['c', 't'],
    isActive: false,
    items: []
  },
  {
    title: 'Timesheets',
    url: '/admin/timesheets',
    icon: 'clock',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'Expenses',
    url: '/admin/expenses',
    icon: 'expenseNote',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title:"Mileage-expenses",
    url: '/admin/mileage-expenses',
    icon: 'mileageNote',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'Invoices',
    url: '/admin/invoices',
    icon: 'receipt',
    shortcut: ['i', 'n'],
    isActive: false,
    items: []
  },
  {
    title: 'Subconstractor_invoices',
    url: '/admin/subcontractor-Invoice',
    icon: 'companies',
    isActive: false,
    shortcut: ['c', 'l'],
    items: []
  },
  {
    title: 'action_system',
    url: '/admin/action-system',
    icon: 'actions',
    isActive: false,
    shortcut: ['c', 'l'],
    items: []
  },
  {
    title:'rechargeable_expenses',
    url:'/admin/rechargeable-expenses',
    icon:'calendarDollar',
    shortcut:['t','s'],
    items:[]
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: 'users',
    shortcut: ['u', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'Clients',
    url: '/admin/clients',
    icon: 'companies',
    isActive: false,
    shortcut: ['c', 'l'],
    items: []
  },
  {
    title:'Salaries',
    url:PATHS.admin.salaries.list.link,
    icon:'calendarDollar',
    isActive:false,
    shortcut:['s','l'],
    items:[]
  },
  {
    title:'Trackers',
    url:PATHS.admin.trackers.list.link,
    icon:'laptop',
    isActive:false,
    shortcut:['t', 'k'],
    items:[]
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: 'settings',
    shortcut: ['s', 't'],
    isActive: true,
    items: [
    ]
  },
  // {
  //   title:'import_document',
  //   url:PATHS.admin.import_document.list.link,
  //   icon:'import',
  //   isActive:false,
  //   shortcut:['i','d'],
  // },
  {
    title:'export_document',
    url:PATHS.admin.export_document.list.link,
    icon:'export',
    isActive:false,
    shortcut:['e','d'],
  }
];



// New role-based exports
export const adminNavItems: NavItem[] = [...navItems];

export const consultantNavItems: NavItem[] = [
  {
    title: 'my_dashboard',
    url: '/consultant/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'my_missions',
    url: '/consultant/missions',
    icon: 'briefcase',
    shortcut: ['m', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'my_contracts',
    url: '/consultant/contracts/show',
    icon: 'page',
    shortcut: ['c', 't'],
    isActive: false,
    items: []
  },
  // {
  //   title: 'my_invoices',
  //   url: '/consultant/invoices',
  //   icon: 'receipt',
  //   shortcut: ['i', 'n'],
  //   isActive: false,
  //   items: []
  // },
  {
    title: 'my_timesheets',
    url: '/consultant/timesheets',
    icon: 'clock',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title:'rechargeable_expenses',
    url:'/consultant/rechargeable-expenses',
    icon:'calendarDollar',
    shortcut:['t','s'],
    items:[],
  },
  {
    title: 'my_expenses',
    url: '/consultant/expenses',
    icon: 'expenseNote',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'my_Mileage_expenses',
    url: '/consultant/mileage-expenses',
    icon: 'mileageNote',
    shortcut: ['t', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'my_profile',
    url: '/consultant/profile/show',
    icon: 'users',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  // {
  //   title:'my_companies',
  //   url:'/consultant/companies',
  //   icon: 'my_companies',
  //   isActive: false,
  //   shortcut: ['d', 'd'],
  //   items: []
  // },
  {
    title: 'my_documents',
    url:PATHS.consultant.documents.list.link,
    icon: 'media',
    isActive: false,
    shortcut: ['m', 'd'],
    items: []
  },


];

export const getNavItemsByRole = (role: 'admin' | 'consultant'): NavItem[] => {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'consultant':
      return consultantNavItems;
    default:
      return [];
  }
};

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}