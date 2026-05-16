import { create } from 'zustand';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import axios, { AxiosError } from 'axios';

export interface Invoice {
  id: string;
  reference: string;
  company: string;
  total_amount: number;
  status: string;
  date_invoice?: string;
  due_date?: string;
  description?: string;
  file?: string;
  supporting_document_path?: string;
  rejection_reason?: string;
  // Add any other fields that might come from the API
}

interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ValidationErrorResponse {
  errors: Record<string, string[]>;
}

interface InvoiceStoreState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
  pagination: Pagination | null;
  fetchInvoices: (params?: Record<string, string>) => Promise<void>;
  getInvoice: (id: string) => Promise<Invoice | null>;
  createInvoice: (data: Partial<Invoice>) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  clearValidationErrors: () => void;
}

export const useInvoiceStore = create<InvoiceStoreState>()((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  validationErrors: null,
  pagination: {
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  },

  clearValidationErrors: () => {
    set({ validationErrors: null });
  },

  fetchInvoices: async (params = {}) => {
    set({ loading: true, error: null, validationErrors: null });
    try {
      // Use the direct API path for subconstractor invoices
      const response = await apiClient.get(apiRoutes.consultant.invoices.list, { params });

      // Handle different response formats
      let invoices = [];
      let paginationData = null;

      // Check if the response has a success property (as seen in your create response)
      if (response.data && response.data.success === true) {
        // Format 1: { success: true, data: { invoices: [...] }, message: "..." }
        if (response.data.data && response.data.data.invoices && Array.isArray(response.data.data.invoices)) {
          invoices = response.data.data.invoices;
        }
        // Format 2: { success: true, data: [...], message: "..." }
        else if (response.data.data && Array.isArray(response.data.data)) {
          invoices = response.data.data;
        }
        // Format 3: { success: true, data: { data: [...] }, message: "..." }
        else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          invoices = response.data.data.data;

          // Extract pagination if available
          if (response.data.data.meta) {
            paginationData = {
              total: response.data.data.meta.total || 0,
              per_page: response.data.data.meta.per_page || 10,
              current_page: response.data.data.meta.current_page || 1,
              last_page: response.data.data.meta.last_page || 1,
            };
          }
        }
      } else if (response.data && response.data.data) {
        // Standard Laravel resource format
        invoices = response.data.data;

        // Extract pagination if available
        if (response.data.meta) {
          paginationData = {
            total: response.data.meta.total || 0,
            per_page: response.data.meta.per_page || 10,
            current_page: response.data.meta.current_page || 1,
            last_page: response.data.meta.last_page || 1,
          };
        }
      } else if (Array.isArray(response.data)) {
        // Direct array response
        invoices = response.data;
      }

      // Default pagination if none exists
      if (!paginationData) {
        paginationData = {
          total: invoices.length,
          per_page: 10,
          current_page: 1,
          last_page: Math.ceil(invoices.length / 10) || 1,
        };
      }

      console.log('Processed invoices:', invoices);

      set({
        invoices: invoices,
        pagination: paginationData,
        loading: false
      });
    } catch (error: unknown) {
      console.error('Failed to fetch invoices:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load invoices. Please try again later.',
        loading: false,
        invoices: [],
        pagination: {
          total: 0,
          per_page: 10,
          current_page: 1,
          last_page: 1
        }
      });
      toast.error('Failed to load invoices');
    }
  },
  getInvoice: async (id: string) => {
    try {
      const response = await apiClient.get(apiRoutes.consultant.invoices.detail(id));

      if (!response.data) {
        throw new Error('Invalid response format from server');
      }

      // Handle the nested structure shown in your API response
      let invoice = null;

      // Case 1: { success: true, data: { invoice: {...} } }
      if (response.data.success === true && response.data.data && response.data.data.invoice) {
        invoice = response.data.data.invoice;
        console.log('Extracted invoice from success.data.invoice structure:', invoice);
      }
      // Case 2: { data: {...} }
      else if (response.data.data && !Array.isArray(response.data.data)) {
        invoice = response.data.data;
        console.log('Extracted invoice from data structure:', invoice);
      }
      // Case 3: Direct object
      else {
        invoice = response.data;
        console.log('Using direct response data as invoice:', invoice);
      }

      return invoice;
    } catch (error: unknown) {
      console.error('Failed to fetch invoice details:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load invoice details.'
      });
      toast.error('Failed to load invoice details');
      return null;
    }
  },
  createInvoice: async (data: Partial<Invoice>) => {
    set({ loading: true, error: null, validationErrors: null });
    try {
      // For file uploads, we need to use FormData
      const formData = new FormData();

      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'file_path' && value) {
          // Skip file_path as we'll handle it separately
          return;
        }

        // Don't convert dates to ISO strings anymore - send as YYYY-MM-DD
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Use the correct API endpoint for subconstractor invoices
      const response = await apiClient.post(
        apiRoutes.consultant.invoices.create,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Create invoice response:', response.data);

      let newInvoice = null;

      // Handle the specific response structure you showed in the console
      if (response.data && response.data.success === true && response.data.data && response.data.data.invoice) {
        newInvoice = response.data.data.invoice;
      } else if (response.data && response.data.data) {
        newInvoice = response.data.data;
      } else if (response.data) {
        newInvoice = response.data;
      }

      if (!newInvoice) {
        throw new Error('Invalid response format from server');
      }

      // Refresh the list with a slight delay to ensure backend consistency
      setTimeout(async () => {
        await get().fetchInvoices();
      }, 500);

      set({ loading: false });
      toast.success('Invoice created successfully');
      return newInvoice;
    } catch (error: unknown) {
      console.error('Failed to create invoice:', error);

      // Handle validation errors from Laravel
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ValidationErrorResponse>;
        if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
          const validationErrors = axiosError.response.data.errors;
          // Instead of showing a toast, set the validation errors in the store
          set({ validationErrors: validationErrors });
        } else if (axiosError.response?.data && 'error' in axiosError.response.data) {
          // Handle custom error messages from the API
          const errorMessage = (axiosError.response.data as any).error || 'Failed to create invoice';
          set({ error: errorMessage });
        } else {
          set({ error: 'Failed to create invoice' });
        }
      } else {
        set({ error: error instanceof Error ? error.message : 'Failed to create invoice.' });
      }

      set({ loading: false });
      return null;
    }
  },

  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    set({ loading: true, error: null, validationErrors: null });
    try {
      // For file uploads, we need to use FormData
      const formData = new FormData();

      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'file_path' && value) {
          // Skip file_path as we'll handle it separately
          return;
        }

        // Don't convert dates to ISO strings anymore
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Append _method field to simulate PUT request (Laravel convention)
      formData.append('_method', 'PUT');

      const response = await apiClient.post(
        apiRoutes.consultant.invoices.update(id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      let updatedInvoice = null;
      if (response.data && response.data.data) {
        updatedInvoice = response.data.data;
      } else if (response.data) {
        updatedInvoice = response.data;
      }

      if (!updatedInvoice) {
        throw new Error('Invalid response format from server');
      }

      // Refresh the list
      await get().fetchInvoices();

      set({ loading: false });
      toast.success('Invoice updated successfully');
      return updatedInvoice;
    } catch (error: unknown) {
      console.error('Failed to update invoice:', error);

      // Handle validation errors from Laravel
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ValidationErrorResponse>;
        if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
          const validationErrors = axiosError.response.data.errors;
          // Instead of showing a toast, set the validation errors in the store
          set({ validationErrors: validationErrors });
        } else {
          set({ error: 'Failed to update invoice' });
        }
      } else {
        set({ error: error instanceof Error ? error.message : 'Failed to update invoice.' });
      }

      set({ loading: false });
      return null;
    }
  },

  deleteInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Use direct API path for subconstractor invoices
      await apiClient.delete(apiRoutes.consultant.invoices.detail(id));
      // Refresh the list
      await get().fetchInvoices();

      set({ loading: false });
      toast.success('Invoice deleted successfully');
      return true;
    } catch (error: unknown) {
      console.error('Failed to delete invoice:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete invoice.',
        loading: false
      });
      toast.error('Failed to delete invoice');
      return false;
    }
  }
}));