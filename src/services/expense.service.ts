import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseFilters, ExpenseStatistics } from '@/types/expense.types';

export const expenseService = {
  list: (filters?: ExpenseFilters) =>
    apiClient.get<PaginatedResponse<Expense>>(apiRoutes.expenses.list, { params: filters }).then((r) => r.data),

  show: (id: string) =>
    apiClient.get<ApiResponse<Expense>>(apiRoutes.expenses.show(id)).then((r) => r.data),

  create: (input: CreateExpenseInput) =>
    apiClient.post<ApiResponse<Expense>>(apiRoutes.expenses.create, input).then((r) => r.data),

  update: (id: string, input: UpdateExpenseInput) =>
    apiClient.put<ApiResponse<Expense>>(apiRoutes.expenses.update(id), input).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.expenses.delete(id)).then((r) => r.data),

  statistics: (params?: { agency_id?: string; vehicle_id?: string }) =>
    apiClient.get<ApiResponse<ExpenseStatistics>>(apiRoutes.expenses.statistics, { params }).then((r) => r.data),
};
