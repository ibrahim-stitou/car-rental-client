// stores/expense-store.ts
import { create } from 'zustand';
import { toast } from '@/components/ui/sonner';
import { Expense } from '@/features/settings/expense/types';

// Define JSON server URL
const JSON_SERVER_URL = 'http://localhost:3001';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  nextId: number;
  totalItems: number;

  // Actions
  fetchExpenses: (page?: number, limit?: number, search?: string) => Promise<Expense[]>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean>;
  updateExpense: (expense: Expense) => Promise<boolean>;
  deleteExpense: (id: number | string) => Promise<boolean>;
  initializeNextId: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,
  nextId: 100,
  totalItems: 0,

  initializeNextId: async () => {
    try {
      const response = await fetch(`${JSON_SERVER_URL}/expenses?_sort=id&_order=desc&_limit=1`);
      if (response.ok) {
        const [highestItem] = await response.json();
        if (highestItem) {
          set({ nextId: Number(highestItem.id) + 1 });
        }
      }
    } catch (error) {
      console.error("Failed to initialize nextId:", error);
    }
  },

  fetchExpenses: async (page = 1, limit = 10, search = '') => {
    set({ isLoading: true, error: null });

    try {
      // Build query parameters for pagination and filtering
      const queryParams = new URLSearchParams({
        _page: page.toString(),
        _limit: limit.toString(),
        _sort: 'id',
        _order: 'desc'
      });

      // Add search parameter if provided
      if (search) {
        queryParams.append('q', search);
      }

      // Fetch paginated data
      const response = await fetch(`${JSON_SERVER_URL}/expenses?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const expenses = await response.json();

      // Get total count from header (JSON Server provides this)
      const totalCount = response.headers.get('X-Total-Count');
      const totalItems = totalCount ? parseInt(totalCount, 10) : expenses.length;

      set({ expenses, isLoading: false, totalItems });
      return expenses;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      });
      return [];
    }
  },

  addExpense: async (expense: Omit<Expense, 'id'>) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const nextId = get().nextId; // Get the next numeric ID

      const response = await fetch(`${JSON_SERVER_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expense,
          id: nextId, // Explicitly set numeric ID
          createdAt: now,
          updatedAt: now
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const newExpense = await response.json();

      set(state => ({
        isLoading: false,
        nextId: state.nextId + 1
      }));
      toast.success("Expense category added successfully");
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      });
      toast.error("Failed to add expense category");
      return false;
    }
  },

  updateExpense: async (expense: Expense) => {
    set({ isLoading: true, error: null });

    try {
      // Ensure ID is a number
      const numericId = Number(expense.id);

      // Explicitly format the URL correctly
      const url = `${JSON_SERVER_URL}/expenses/${numericId}`;
      console.log("Making PATCH request to:", url);

      const now = new Date().toISOString();
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expense.title,
          description: expense.description,
          updatedAt: now
        })
      });

      if (!response.ok) {
        console.error("PATCH request failed with status:", response.status);
        throw new Error(`Failed to update expense: ${response.status} ${response.statusText}`);
      }

      const updatedExpense = await response.json();

      // Update the expense in the local state
      set(state => ({
        isLoading: false,
        expenses: state.expenses.map(item =>
          item.id === numericId ? updatedExpense : item
        )
      }));

      toast.success("Expense category updated successfully");
      return true;
    } catch (error) {
      console.error("Update error:", error);
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      });
      toast.error("Failed to update expense category");
      return false;
    }
  },

  deleteExpense: async (id: number | string) => {
    set({ isLoading: true, error: null });

    try {
      // Ensure ID is a number
      const numericId = Number(id);

      // Explicitly format the URL correctly
      const url = `${JSON_SERVER_URL}/expenses/${numericId}`;
      console.log("Making DELETE request to:", url);

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error("DELETE request failed with status:", response.status);
        throw new Error(`Failed to delete expense: ${response.status} ${response.statusText}`);
      }

      // Remove the deleted expense from the local state
      set(state => ({
        isLoading: false,
        expenses: state.expenses.filter(item => item.id !== numericId),
        totalItems: state.totalItems - 1
      }));

      toast.success("Expense category deleted successfully");
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      });
      toast.error("Failed to delete expense category");
      return false;
    }
  }
}));