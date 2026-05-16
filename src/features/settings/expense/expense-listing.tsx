'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { ExpenseTable } from './expense-table';
import { expenseColumns } from './expense-table/columns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DeleteExpenseModal } from '@/features/settings/expense/delete-expense-modal';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const expenseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  observation: z.string().optional(),
});

interface Expense {
  id: number;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string | null;
}

interface ExpenseResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Expense[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  filters: any[];
}

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const defaultExpenseFormValues: ExpenseFormValues = {
  title: "",
  observation: "",
};

export default function ExpenseListing() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const isMounted = useRef(false);
  const initialCleanupDone = useRef(false);

  const DEFAULT_PAGE = 1;
  const DEFAULT_PER_PAGE = 10;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [page, setPage] = useState(DEFAULT_PAGE);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState(search);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaultExpenseFormValues,
    mode: 'onChange'
  });

  useEffect(() => {
    if (!initialCleanupDone.current && window.location.search) {
      window.history.replaceState({}, '', pathname);
      initialCleanupDone.current = true;
    }
  }, [pathname]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);

      const newIntervalId = setInterval(() => {
        if (window.location.search) {
          window.history.replaceState({}, '', pathname);
        }
      }, 500);

      return () => clearInterval(newIntervalId);
    }, 2000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchExpenses = async (page: number, perPage: number, search: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get<ExpenseResponse>(
        `${apiRoutes.admin.expenseCategories.list}?${params.toString()}`
      );

      if (response.data.success) {
        setExpenses(response.data.data.data || []);
        setTotalItems(response.data.data.total);
        setLastPage(response.data.data.last_page);
      } else {
        setError(t('admin.settings.expenses.error.fetchFailed'));
        toast.error(t('admin.settings.expenses.toast.loadFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('admin.settings.expenses.error.fetchFailed'));
      toast.error(t('admin.settings.expenses.toast.loadFailed'));
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }
  };

  useEffect(() => {
    fetchExpenses(page, perPage, searchDebounced);
  }, [page, perPage, searchDebounced]);

  const addExpense = async (data: { title: string, description?: string }) => {
    setFormLoading(true);
    try {
      await apiClient.post(apiRoutes.admin.expenseCategories.create, data);
      toast.success(t('admin.settings.expenses.toast.addSuccess'));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.expenses.toast.addFailed'));
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const updateExpense = async (data: { id: number, title: string, description?: string }) => {
    setFormLoading(true);
    try {
      await apiClient.put(apiRoutes.admin.expenseCategories.update(data.id), {
        title: data.title,
        description: data.description
      });
      toast.success(t('admin.settings.expenses.toast.updateSuccess'));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.expenses.toast.updateFailed'));
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await apiClient.delete(apiRoutes.admin.expenseCategories.detail(id));
      toast.success(t('admin.settings.expenses.toast.deleteSuccess'));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.expenses.toast.deleteFailed'));
      return false;
    }
  };

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      let success;

      if (isEditing && editingId !== null) {
        success = await updateExpense({
          id: editingId,
          title: data.title,
          description: data.observation,
        });

        if (success) {
          cancelEdit();
          await fetchExpenses(page, perPage, searchDebounced);
        }
      } else {
        success = await addExpense({
          title: data.title,
          description: data.observation,
        });

        if (success) {
          form.reset(defaultExpenseFormValues);
          await fetchExpenses(page, perPage, searchDebounced);
        }
      }
    } catch (error) {
      toast.error(isEditing
        ? t('admin.settings.expenses.toast.updateFailed')
        : t('admin.settings.expenses.toast.addFailed')
      );
    }
  };

  const handleEdit = (id: number) => {
    form.reset(defaultExpenseFormValues);
    const expenseToEdit = expenses.find(exp => exp.id === id);
    if (expenseToEdit) {
      setTimeout(() => {
        form.setValue('title', expenseToEdit.title || '');
        form.setValue('observation', expenseToEdit.description || '');
        setEditingId(id);
        setIsEditing(true);
      }, 10);
    }
  };

  const cancelEdit = () => {
    form.reset(defaultExpenseFormValues);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleOpenDeleteModal = (id: number) => {
    setSelectedExpenseId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (selectedExpenseId !== null) {
      const success = await deleteExpense(selectedExpenseId);
      setIsDeleteModalOpen(false);
      setSelectedExpenseId(null);

      if (success) {
        fetchExpenses(page, perPage, searchDebounced);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isEditing) {
      cancelEdit();
    }
    setPage(newPage);
    setTimeout(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 0);
  };

  const handlePerPageChange = (newPerPage: number) => {
    if (isEditing) {
      cancelEdit();
    }
    setPerPage(newPerPage);
    if (page !== DEFAULT_PAGE) {
      setPage(DEFAULT_PAGE);
    }
    setTimeout(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 0);
  };

  const handleSearchChange = (newSearch: string) => {
    if (isEditing) {
      cancelEdit();
    }
    setSearch(newSearch);
    if (page !== DEFAULT_PAGE) {
      setPage(DEFAULT_PAGE);
    }
    setTimeout(() => {
      if (window.location.search) {
        window.history.replaceState({}, '', pathname);
      }
    }, 0);
  };

  const columns = expenseColumns({
    onOpenModal: handleOpenDeleteModal,
    onEdit: handleEdit
  });

  const isEmptyList = !isLoading && !isInitialLoading && expenses.length === 0;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.settings.expenses.listing.title')}
          description={t('admin.settings.expenses.listing.description')}
        />
      </div>
      <Separator />
      <Card className="shadow-sm bg-white border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                <div className="flex-1 min-w-[150px]">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel
                          className="text-xs font-medium">{t('admin.settings.expenses.form.title')}*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.settings.expenses.form.titlePlaceholder')}
                                 className="h-8 text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1 min-w-[150px]">
                  <FormField
                    control={form.control}
                    name="observation"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel
                          className="text-xs font-medium">{t('admin.settings.expenses.form.observation')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.settings.expenses.form.observationPlaceholder')}
                                 className="h-8 text-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-end gap-2 mt-auto">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      className="h-8 text-xs py-0 px-3"
                    >
                      {t('admin.settings.expenses.actions.cancel')}
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="h-8 text-xs py-0 px-3"
                  >
                    {formLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {isEditing
                      ? formLoading ? t('admin.settings.expenses.actions.updating') : t('admin.settings.expenses.actions.update')
                      : formLoading ? t('admin.settings.expenses.actions.adding') : t('admin.settings.expenses.actions.add')
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>

      {isEmptyList && searchDebounced && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">{t('admin.settings.expenses.alerts.noResultsTitle')}</AlertTitle>
          <AlertDescription className="text-blue-600">
            {t('admin.settings.expenses.alerts.noResultsDesc')}
          </AlertDescription>
        </Alert>
      )}

      {isEmptyList && !searchDebounced && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">{t('admin.settings.expenses.alerts.noExpensesTitle')}</AlertTitle>
          <AlertDescription className="text-amber-600">
            {t('admin.settings.expenses.alerts.noExpensesDesc')}
          </AlertDescription>
        </Alert>
      )}

      {(isInitialLoading || isLoading || !isEmptyList) && (
        <ExpenseTable
          data={expenses}
          totalItems={totalItems}
          columns={columns}
          currentPage={page}
          perPage={perPage}
          lastPage={lastPage}
          loading={isLoading}
          error={error}
          search={search}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}

      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteExpense}
        expenseId={selectedExpenseId}
      />
    </div>
  );
}