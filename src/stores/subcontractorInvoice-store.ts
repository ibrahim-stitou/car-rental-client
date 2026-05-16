import { create } from 'zustand';
import { toast } from 'sonner';
import { apiRoutes } from '@/config/apiRoutes';
import apiClient from '@/lib/api';

export interface Consultant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  status: string;
  full_name: string;
  profile_image_url: string;
}

export interface Media {
  id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  original_url: string;
  preview_url: string;
}

export interface Rejection {
  id: number;
  rejectable_type: string;
  rejectable_id: number;
  user_id: number;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  collection_name: string;
  created_at: string;
}

export interface SubcontractorInvoice {
  id: number | string;
  reference: string;
  company: string;
  total_amount: string | number;
  status: string;
  date_invoice: string;
  consultant_id?: number;
  consultant?: Consultant;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  media?: Media[];
  rejections?: Rejection[];
  description?: string;
  due_date?: string;
  file?: string;
  supporting_document_path?: string;
  rejection_reason?: string;
}

interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface SubcontractorInvoiceStoreState {
  invoices: SubcontractorInvoice[];
  documents: Document[];
  loading: boolean;
  error: string | null;
  search: string;
  pagination: Pagination;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setSearch: (search: string) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  fetchInvoices: () => Promise<void>;
  getInvoice: (id: number | string) => Promise<{ invoice: SubcontractorInvoice, documents: Document[] } | null>;
  validateInvoice: (id: number | string) => Promise<boolean>;
  rejectInvoice: (id: number | string, reason: string) => Promise<boolean>;
  removeInvoice: (id: number | string) => Promise<boolean>;
  createInvoice: (invoiceData: Partial<SubcontractorInvoice>, supportingDocumentPath?: string) => Promise<SubcontractorInvoice | null>;
  updateInvoice: (id: number | string, invoiceData: Partial<SubcontractorInvoice>, supportingDocumentPath?: string) => Promise<SubcontractorInvoice | null>;
  deleteInvoice: (id: number | string) => Promise<boolean>;
}

export const useSubcontractorInvoiceStore = create<SubcontractorInvoiceStoreState>((set, get) => ({
  invoices: [],
  documents: [],
  loading: false,
  error: null,
  search: '',
  pagination: {
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  },
  isAdmin: true,
  setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),

  setSearch: (search: string) => set({ search }),

  setPagination: (paginationUpdate: Partial<Pagination>) =>
    set((state) => ({
      pagination: { ...state.pagination, ...paginationUpdate }
    })),

  fetchInvoices: async () => {
    const { search, pagination, isAdmin } = get();
    set({ loading: true, error: null });
    try {
      const endpoint = isAdmin
        ? apiRoutes.admin.subcontractorInvoices.list
        : apiRoutes.consultant.invoices.list;
      const params = new URLSearchParams();
      params.append('page', pagination.current_page.toString());
      params.append('per_page', pagination.per_page.toString());
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`${endpoint}?${params.toString()}`);

      if (!response.data.success) {
        throw new Error('Failed to fetch invoices');
      }

      const paginatedData = response.data.data;

      set({
        invoices: paginatedData.data,
        pagination: {
          total: paginatedData.total,
          per_page: paginatedData.per_page,
          current_page: paginatedData.current_page,
          last_page: paginatedData.last_page || Math.ceil(paginatedData.total / paginatedData.per_page) || 1
        },
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load invoices',
        loading: false
      });
      toast.error('Failed to load invoices');
    }
  },

  getInvoice: async (id: number | string) => {
    const { isAdmin } = get();
    set({ loading: true, error: null });

    try {
      const endpoint = apiRoutes.admin.subcontractorInvoices.detail(id);

      const response = await apiClient.get(endpoint);

      if (!response.data.success) {
        throw new Error('Failed to fetch invoice details');
      }
      const { invoice, documents } = response.data.data;

      set({
        loading: false,
        documents: documents || []
      });

      return { invoice, documents: documents || [] };
    } catch (error: any) {
      console.error('Failed to fetch invoice details:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load invoice details',
        loading: false
      });
      toast.error('Failed to load invoice details');
      return null;
    }
  },

  validateInvoice: async (id: number | string) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.post(apiRoutes.admin.subcontractorInvoices.approve(id));

      if (!response.data.success) {
        throw new Error('Failed to validate invoice');
      }

      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice validated successfully');
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('Failed to validate invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to validate invoice',
        loading: false
      });
      toast.error('Failed to validate invoice');
      return false;
    }
  },

  rejectInvoice: async (id: number | string, reason: string) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.post(apiRoutes.admin.subcontractorInvoices.reject(id), {
        reason
      });

      if (!response.data.success) {
        throw new Error('Failed to reject invoice');
      }

      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice rejected successfully');
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('Failed to reject invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to reject invoice',
        loading: false
      });
      toast.error('Failed to reject invoice');
      return false;
    }
  },
  deleteInvoice: async (id: number | string) => {
    set({ loading: true, error: null });

    try {
      const response = await apiClient.delete(apiRoutes.admin.subcontractorInvoices.delete(id));

      if (!response.data.success) {
        throw new Error('Failed to delete invoice');
      }

      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice deleted successfully');
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
        loading: false
      });
      toast.error('Failed to delete invoice');
      return false;
    }
  },
  removeInvoice: async (id: number | string) => {
    const { isAdmin } = get();
    set({ loading: true, error: null });

    try {
      const endpoint = isAdmin
        ? apiRoutes.admin.subcontractorInvoices.delete(id)
        : apiRoutes.consultant.invoices.delete(id);

      const response = await apiClient.delete(endpoint);

      if (!response.data.success) {
        throw new Error('Failed to delete invoice');
      }

      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice deleted successfully');
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
        loading: false
      });
      toast.error('Failed to delete invoice');
      return false;
    }
  },

  createInvoice: async (invoiceData: Partial<SubcontractorInvoice>, supportingDocumentPath?: string) => {
    set({ loading: true, error: null });

    try {
      const payload = {
        ...invoiceData,
        supporting_document_path: supportingDocumentPath
      };

      const response = await apiClient.post(apiRoutes.consultant.invoices.create, payload);

      if (!response.data.success) {
        throw new Error('Failed to create invoice');
      }

      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice created successfully');
      set({ loading: false });
      return response.data.data.invoice;
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create invoice',
        loading: false
      });
      toast.error('Failed to create invoice');
      return null;
    }
  },

  updateInvoice: async (id: number | string, invoiceData: Partial<SubcontractorInvoice>, supportingDocumentPath?: string) => {
    set({ loading: true, error: null });

    try {
      const payload = {
        ...invoiceData,
        supporting_document_path: supportingDocumentPath
      };

      const response = await apiClient.put(
        apiRoutes.consultant.invoices.update(id),
        payload
      );

      if (!response.data.success) {
        throw new Error('Failed to update invoice');
      }
      await get().fetchInvoices();
      toast.success(response.data.message || 'Invoice updated successfully');
      set({ loading: false });
      return response.data.data.invoice;
    } catch (error: any) {
      console.error('Failed to update invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update invoice',
        loading: false
      });
      toast.error('Failed to update invoice');
      return null;
    }
  }
}));