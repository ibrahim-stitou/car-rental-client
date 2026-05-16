// src/config/apiRoutes.ts

import { List } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiRoutes = {
  auth: {
    login: `${API_BASE}/login`,
    logout: `${API_BASE}/logout`,
    refreshToken: `${API_BASE}/refresh-token`,
    forgotPassword: `${API_BASE}/forgot-password`,
    resetPassword: `${API_BASE}/reset-password`,
    me: `${API_BASE}/me`,
  },

  files: {
    uploadTemp: `${API_BASE}/files/upload-temp`,
    cleanupTemp: `${API_BASE}/files/cleanup-temp`,
  },

  admin: {
    security:{
      updatePassword: `${API_BASE}/admin/security/updatePassword`
    },
    users: {
      list: `${API_BASE}/admin/users`,
      create: `${API_BASE}/admin/users`,
      detail: (id: string | number) => `${API_BASE}/admin/users/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/users/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/users/${id}`,
      uploadMedia: (userId: string | number) => `${API_BASE}/admin/users/${userId}/media`,
      deleteMedia: (userId: string | number, mediaId: string | number) =>
        `${API_BASE}/admin/users/${userId}/media/${mediaId}`,
      getMedia: (userId: string | number, collection?: string) =>
        `${API_BASE}/admin/users/${userId}/media/${collection || ''}`,
      attachMedia: `${API_BASE}/admin/files/attach`,
      getAvatar: (userId: string | number) => `${API_BASE}/admin/users/${userId}/avatar`,
    },
    clients: {
      list: `${API_BASE}/admin/clients`,
      create: `${API_BASE}/admin/clients`,
      detail: (id: string | number) => `${API_BASE}/admin/clients/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/clients/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/clients/${id}`,
    },
    expenses: {
      list: `${API_BASE}/admin/expenses`,
      approve: (id: string | number) => `${API_BASE}/admin/expenses/${id}/approve`,
      reject: (id: string | number) => `${API_BASE}/admin/expenses/${id}/reject`,
      detail: (id: string | number) => `${API_BASE}/admin/expenses/${id}`,
      delete: (id: string | number)=> `${API_BASE}/admin/expenses/${id}`,
    },
    missions: {
      list: `${API_BASE}/admin/missions`,
      create: `${API_BASE}/admin/missions`,
      simpleList: `${API_BASE}/admin/missions/simple-list`,
      detail: (id: string | number) => `${API_BASE}/admin/missions/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/missions/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/missions/${id}`,
    },
    contracts: {
      list: `${API_BASE}/admin/contracts`,
      create: `${API_BASE}/admin/contracts`,
      detail: (id: string | number) => `${API_BASE}/admin/contracts/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/contracts/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/contracts/${id}`,
    },
    roles: {
      list: `${API_BASE}/admin/roles`,
      create: `${API_BASE}/admin/roles`,
      detail: (id: string | number) => `${API_BASE}/admin/roles/${id}`,
    },
    mileageExpenses: {
      list: `${API_BASE}/admin/mileage-expenses`,
      approve: (expenseId: string | number) => `${API_BASE}/admin/mileage-expenses/${expenseId}/approve`,
      reject: (expenseId: string | number) => `${API_BASE}/admin/mileage-expenses/${expenseId}/reject`,
      detail: (id: string | number) => `${API_BASE}/admin/mileage-expenses/${id}/show`,
      delete:(id:string|number)=> `${API_BASE}/admin/mileage-expenses/${id}/delete`
    },
    timesheets: {
      list: `${API_BASE}/admin/timesheets`,
      create: `${API_BASE}/admin/timesheets`,
      detail: (id: string | number) => `${API_BASE}/admin/timesheets/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/timesheets/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/timesheets/${id}`,
      reject: (id: string | number) => `${API_BASE}/admin/timesheets/${id}/reject`,
      validate: (id: string | number) => `${API_BASE}/admin/timesheets/${id}/validate`,
    },
    countries: {
      list: `${API_BASE}/admin/pays`,
    },
    invoices: {
      list: `${API_BASE}/admin/invoices`,
      create: `${API_BASE}/admin/invoices`,
      detail: (id: string | number) => `${API_BASE}/admin/invoices/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/invoices/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/invoices/${id}`,
      validate: (id: string | number) => `${API_BASE}/admin/invoices/${id}/validate`,
      devalidate: (id: string | number) => `${API_BASE}/admin/invoices/${id}/devalidate`,
      changeReference: (id: string | number) => `${API_BASE}/admin/invoices/${id}/change-reference`,
      send:(id: number|string) => `${API_BASE}/admin/invoices/${id}/send`,
      getConsultantClient :(id: number|string) => `${API_BASE}/admin/invoices/get-client-consultant/${id}`,
      updateDate: (id: string | number) => `${API_BASE}/admin/invoices/${id}/update-date`,
    },
    invoiceLines: {
      create: `${API_BASE}/admin/invoice-lignes`,
      update: (id: string | number) => `${API_BASE}/admin/invoice-lignes/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/invoice-lignes/${id}`,
    },
    rechargeableExpenses: {
      list: `${API_BASE}/admin/rechargeable-expenses`,
      create: `${API_BASE}/admin/rechargeable-expenses`,
      detail: (id: string | number) => `${API_BASE}/admin/rechargeable-expenses/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/rechargeable-expenses/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/rechargeable-expenses/${id}`,
      approve: (expenseId: string | number) => `${API_BASE}/admin/rechargeable-expenses/${expenseId}/approve`,
      reject: (expenseId: string | number) => `${API_BASE}/admin/rechargeable-expenses/${expenseId}/reject`,
      lines: {
        list: (expenseId: string | number) => `${API_BASE}/admin/rechargeable-expenses/${expenseId}/lignes`,
        create: (expenseId: string | number) => `${API_BASE}/admin/rechargeable-expenses/${expenseId}/lignes`,
        update: (lineId: string | number) => `${API_BASE}/admin/rechargeable-expense-lignes/${lineId}`,
        delete: (lineId: string | number) => `${API_BASE}/admin/rechargeable-expense-lignes/${lineId}`,
      },
    },
    expenseCategories: {
      list: `${API_BASE}/admin/expense-categories`,
      create: `${API_BASE}/admin/expense-categories`,
      detail: (id: string | number) => `${API_BASE}/admin/expense-categories/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/expense-categories/${id}`,
    },
    payments: {
      list: `${API_BASE}/admin/paiements`,
      create: `${API_BASE}/admin/paiements`,
      detail: (id:number |string)=> `${API_BASE}/admin/paiements/${id}`,
      delete: (id:number |string)=> `${API_BASE}/admin/paiements/${id}`,
    },
    settings: {
      updtaeParKey: (key: string) => `${API_BASE}/admin/settings/key/${key}`,
      showByKey: (key: string) => `${API_BASE}/admin/settings/key/${key}`,
      daysOff: {
        list: `${API_BASE}/admin/settings/days-off`,
        create: `${API_BASE}/admin/settings/days-off`,
        detail: (id: string | number) => `${API_BASE}/admin/settings/days-off/${id}`,
        update: (id: string | number) => `${API_BASE}/admin/settings/days-off/${id}`,
        delete: (id: string | number) => `${API_BASE}/admin/settings/days-off/${id}`,
      },
      emailsCC:{
        list: `${API_BASE}/admin/email-cc`,
        create: `${API_BASE}/admin/email-cc`,
        detail: (id: string | number) => `${API_BASE}/admin/email-cc/${id}`,
        update: (id: string | number) => `${API_BASE}/admin/email-cc/${id}`,
        delete: (id: string | number) => `${API_BASE}/admin/email-cc/${id}`,
        toggleActive: (id: string | number) => `${API_BASE}/admin/email-cc/${id}/toggle-active`,
      }
    },
    banks:{
      simpleList: `${API_BASE}/admin/banks/simple-list`
    },
    subcontractorInvoices: {
      list: `${API_BASE}/admin/subconstractor-invoices`,
      detail: (id: string | number) => `${API_BASE}/admin/subconstractor-invoices/${id}`,
      approve: (id: string | number) => `${API_BASE}/admin/subconstractor-invoices/${id}/approve`,
      reject: (id: string | number) => `${API_BASE}/admin/subconstractor-invoices/${id}/reject`,
      delete: (id: string | number) => `${API_BASE}/admin/subconstractor-invoices/${id}`,
      create:`${API_BASE}/admin/subconstractor-invoices`
    },
    counts:`${API_BASE}/admin/review-counts`,
    dashboardCounts:`${API_BASE}/admin/dashboard-counts`,
    flatFees: {
      generate: `${API_BASE}/admin/flat-fees/generate`,
      history: `${API_BASE}/admin/flat-fees/history`,
      lastGeneration: `${API_BASE}/admin/flat-fees/last-generation`,
      exportLogs: `${API_BASE}/admin/flat-fees/export-logs`,
      stats: `${API_BASE}/admin/flat-fees/stats`,
      consultant: (consultant: string | number) => `${API_BASE}/admin/flat-fees/consultant/${consultant}`,
      generationDetails: (log: string | number) => `${API_BASE}/admin/flat-fees/generation/${log}/details`,
    },
    systemAction:{
      generate: `${API_BASE}/admin/action-system/generate`,
      history: `${API_BASE}/admin/action-system/history`,
      lastGeneration: `${API_BASE}/admin/action-system/last-generation`,
      exportLogs: `${API_BASE}/admin/action-system/export-logs`,
      stats: `${API_BASE}/admin/action-systemstats`,
      consultant: (consultant: string | number) => `${API_BASE}/admin/action-system/consultant/${consultant}`,
      generationDetails: (log: string | number) => `${API_BASE}/admin/action-system/generation/${log}/details`,
    },
    trackers:{
      list: `${API_BASE}/admin/trackers`,
      create: `${API_BASE}/admin/trackers`,
      labels: `${API_BASE}/admin/trackers/labels`,
      delete: (id: string | number) => `${API_BASE}/admin/trackers/${id}`,
      export: `${API_BASE}/admin/trackers/export`,
    },

    salaries:{
      list: `${API_BASE}/admin/salaries`,
      create: `${API_BASE}/admin/salaries`,
      upload: `${API_BASE}/admin/salaries/upload`,
      detail: (id: string | number) => `${API_BASE}/admin/salaries/${id}`,
      update: (id: string | number) => `${API_BASE}/admin/salaries/${id}`,
      delete: (id: string | number) => `${API_BASE}/admin/salaries/${id}`,
      canvas : `${API_BASE}/admin/salaries/canvas`,
    },

    import_document: {
      list: `${API_BASE}/admin/documents-import`,
      create: `${API_BASE}/admin/documents-import`,
      detail: (id: string | number) => `${API_BASE}/admin/documents-import/${id}`,
      status: `${API_BASE}/admin/documents-import/status`,
    },
    documentsExports: {
      list: `${API_BASE}/admin/documents-exports`,
      create: `${API_BASE}/admin/documents-exports`,
      detail: (id: string | number) => `${API_BASE}/admin/documents-exports/${id}`,
      download: (rowId: string | number) => `${API_BASE}/admin/documents-exports/${rowId}/download`,
      markAsPaid: (id: string | number) => `${API_BASE}/admin/documents-exports/${id}/paid`,
    },
  },

  // Consultant routes
  consultant: {
    security:{
      updatePassword: `${API_BASE}/consultant/security/update-password`,
    },
    invoices: {
      list: `${API_BASE}/consultant/subconstractor-invoice`,
      detail: (id: string | number) => `${API_BASE}/consultant/subconstractor-invoice/${id}`,
      create: `${API_BASE}/consultant/subconstractor-invoice`,
      update: (id: string | number) => `${API_BASE}/consultant/subconstractor-invoice/${id}/corriger`,
      delete: (id: string | number) => `${API_BASE}/consultant/subconstractor-invoice/${id}`,
    },
    clients: {
      list: `${API_BASE}/consultant/clients`,
      create: `${API_BASE}/consultant/clients`,
      detail: (id: string | number) => `${API_BASE}/consultant/clients/${id}`,
    },
    tracker:{
      trackerPerYear:(year:number |string)=> `${API_BASE}/consultant/journals-by-year/${year}`,
      exportToExcel:(year:number |string)=> `${API_BASE}/consultant/journals-by-year/${year}/export`,
    },
    expenses: {
      list: `${API_BASE}/consultant/expenses`,
      create: `${API_BASE}/consultant/expenses`,
      update: (id: string | number) => `${API_BASE}/consultant/expenses/${id}`,
      correct: (id: string | number) => `${API_BASE}/consultant/expenses/${id}/correct`,
      delete: (id: string | number) => `${API_BASE}/consultant/expenses/${id}`,
      detail: (id: string | number) => `${API_BASE}/consultant/expenses/${id}`,
      categories: `${API_BASE}/consultant/expense-categories`,
      addLine: `${API_BASE}/consultant/expense-details`,
      deleteLine: (id: string | number) => `${API_BASE}/consultant/expense-details/${id}`,
      declare: (id: string | number)=> `${API_BASE}/consultant/expenses/${id}/declare`,
      updateLine: (id: string | number) => `${API_BASE}/consultant/expense-details/${id}`,
      initialise: `${API_BASE}/consultant/expenses/draft`,
      getItems: (id: string | number) => `${API_BASE}/consultant/expenses-details/${id}/items`,
    },
    missions: {
      list: `${API_BASE}/consultant/missions`,
      create: `${API_BASE}/consultant/missions`,
      detail: (id: string | number) => `${API_BASE}/consultant/missions/${id}`,
      update: (id: string | number) => `${API_BASE}/consultant/missions/${id}`,
      selectOptions: `${API_BASE}/consultant/missions-select`,
    },
    timesheets: {
      list: `${API_BASE}/consultant/timesheets`,
      create: `${API_BASE}/consultant/timesheets`,
      detail: (id: string | number) => `${API_BASE}/consultant/timesheets/${id}`,
      draft: (id: string | number) => `${API_BASE}/consultant/timesheets/${id}/draft`,
      coriger: (id: string | number) => `${API_BASE}/consultant/timesheets/${id}/coriger`,
      delete:(id: string |number)=> `${API_BASE}/consultant/timesheets/${id}`
    },
    mileageExpenses: {
      list: `${API_BASE}/consultant/mileage-expenses`,
      create: `${API_BASE}/consultant/mileage-expenses`,
      detail: (id: string | number) => `${API_BASE}/consultant/mileage-expenses/${id}/show`,
      coriger: (id: string | number) => `${API_BASE}/consultant/mileage-expenses/${id}/coriger`,
      declare: (id: string | number) => `${API_BASE}/consultant/mileage-expenses/${id}/declare`,
      duplicateReturn: (detailId: string | number) => `${API_BASE}/consultant/mileage-expenses/details/${detailId}/duplicate-return`,
    },
    consultantCompanies:{
      list:`${API_BASE}/consultant/consultant-companies`,
      create:`${API_BASE}/consultant/consultant-companies`,
      show:(id : number|string)=>`${API_BASE}/consultant/consultant-companies/${id}`,
      delete:(id :number | string)=>`${API_BASE}/consultant/consultant-companies/${id}`,
      countries:`${API_BASE}/consultant/consultant-companies/pays-list`,
    },
    settings:{
      showByKey: (key: string) => `${API_BASE}/consultant/settings/key/${key}`,
    },
    rechargeableExpenses: {
      list: `${API_BASE}/consultant/rechargeable-expenses`,
      create: `${API_BASE}/consultant/rechargeable-expenses`,
      detail: (id: string | number) => `${API_BASE}/consultant/rechargeable-expenses/${id}`,
      correct: (id: string | number) => `${API_BASE}/consultant/rechargeable-expenses/${id}/correct`,
      declare: (id: string | number) => `${API_BASE}/consultant/rechargeable-expenses/${id}/declare`,
      lines: {
        list: (expenseId: string | number) => `${API_BASE}/consultant/rechargeable-expenses/${expenseId}/lignes`,
        create: (expenseId: string | number) => `${API_BASE}/consultant/rechargeable-expenses/${expenseId}/lignes`,
        update: (lineId: string | number) => `${API_BASE}/consultant/rechargeable-expense-lignes/${lineId}`,
        delete: (lineId: string | number) => `${API_BASE}/consultant/rechargeable-expense-lignes/${lineId}`,
      },
    },
    daysOff:{
      list:`${API_BASE}/consultant/days-off/list`
    },
      mileageExpenseDetails: {
      list: `${API_BASE}/consultant/mileage-expense-details`,
      create: `${API_BASE}/consultant/mileage-expense-details`,
      detail: (id: string | number) => `${API_BASE}/consultant/mileage-expense-details/${id}`,
      update: (id: string | number) => `${API_BASE}/consultant/mileage-expense-details/${id}`,
      delete: (id: string | number) => `${API_BASE}/consultant/mileage-expense-details/${id}`,
        correct: (id: string | number) => `${API_BASE}/consultant/mileage-expense-details/${id}`,
    },
    appointments: {
      list: `${API_BASE}/consultant/appointments`,
      create: `${API_BASE}/consultant/appointments`,
      detail: (id: string | number) => `${API_BASE}/consultant/appointments/${id}`,
    },
    contracts:{
      detail:`${API_BASE}/consultant/contracts/show`,
    },
    profile:{
      detail:`${API_BASE}/consultant/profile`
    },
    documents:{
      list:`${API_BASE}/consultant/documents`,
    }
  },
  common: {
    profile: {
      get: `${API_BASE}/user`,
      update: `${API_BASE}/profile`,
      changePassword: `${API_BASE}/password`,
    },
    debug: `${API_BASE}/debug-user`,
    clientsList:`${API_BASE}/admin/clients-list`,
    consultantList:`${API_BASE}/admin/consultants`,
    documentTypes: `${API_BASE}/admin/document-types`,
  },
};

export type ApiRoutes = typeof apiRoutes;

