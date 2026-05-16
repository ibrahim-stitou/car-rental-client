'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from "date-fns";
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { IconCheck, IconReceipt, IconClock, IconX, IconCircleCheck, IconFileDescription } from '@tabler/icons-react';
import { UploadedFile } from '@/components/custom/singlefile-upload';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import ExpenseForm, { ExpenseFormValues } from '@/features/consultant/expenses/components/expense-form-component';
import ExpenseCard, { ExpenseItem } from '@/features/consultant/expenses/components/expense-card-component';
import { useLanguage } from '@/context/LanguageContext';

interface ExpenseDeclaration {
  id: string;
  month: string | number;
  month_name?: string;
  year: string | number;
  total_ttc: number | null;
  mission: {
    id: string | number;
    title: string;
  };
  status: string;
  details?: ExpenseItem[];
}
interface RejectionHistory {
  id: string | number;
  reason: string;
  created_at: string;
}


const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-200 text-slate-800', icon: IconReceipt },
  pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: IconClock },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: IconX },
  validated: { label: 'Validated', color: 'bg-green-100 text-green-800', icon: IconCircleCheck }
};

const getMonthName = (monthNumber: number | string): string => {
  const monthNum = typeof monthNumber === 'string' ? parseInt(monthNumber) : monthNumber;
  const date = new Date();
  date.setMonth(monthNum - 1);
  return date.toLocaleString('default', { month: 'long' });
};

export default function ExpenseEntryPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { expenseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseDeclaration, setExpenseDeclaration] = useState<ExpenseDeclaration | null>(null);
  const [supportingDocument, setSupportingDocument] = useState<UploadedFile | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<{id: number, title: string}[]>([]);
  const [rejectionHistory, setRejectionHistory] = useState<RejectionHistory[]>([]);
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      setIsLoading(true);
      try {
        const declarationResponse = await apiClient.get(
          apiRoutes.consultant.expenses.detail(expenseId as string)
        );

        let expenseData;

        if (declarationResponse.data?.success) {
          expenseData = declarationResponse.data.data;
          if (!expenseData.month_name) {
            expenseData.month_name = getMonthName(expenseData.month);
          }
          if (expenseData.rejections && Array.isArray(expenseData.rejections)) {
            setRejectionHistory(expenseData.rejections);
          }
          setExpenseDeclaration(expenseData);
          if (expenseData.details && Array.isArray(expenseData.details)) {
            const mappedItems = expenseData.details.map((detail: ExpenseItem) => ({
              id: detail.id,
              expense_id: detail.expense_id,
              description: detail.description,
              amount: detail.ammount_ttc || detail.amount_ttc || 0,
              amount_ttc: detail.ammount_ttc || detail.amount_ttc || 0,
              day: detail.day,
              categorie_id: detail.categorie_id,
              category_id: detail.categorie_id,
              receipt_url: detail.media && detail.media.length > 0 ? detail.media[0].original_url : undefined,
              receipt_path: detail.media && detail.media.length > 0 ? detail.media[0].file_name : undefined,
              media: detail.media,
            }));
            setExpenseItems(mappedItems);
          }
        } else {
          toast.error(t('consultant.expenses.errors.load_failed'));
          router.push('/consultant/expenses/new');
        }

        const categoriesResponse = await apiClient.get(apiRoutes.consultant.expenses.categories);
        if (categoriesResponse.data) {
          setCategoryOptions(categoriesResponse.data);
          if (expenseData?.details && Array.isArray(expenseData.details)) {
            setExpenseItems(prevItems =>
              prevItems.map(item => {
                const category = categoriesResponse.data.find(
                  (cat: {id: number}) => cat.id === (item.categorie_id || item.category_id)
                );
                return {
                  ...item,
                  category: category ? { id: category.id, title: category.title } : undefined,
                  category_name: category ? category.title : undefined,
                };
              })
            );
          }
        }

      } catch (error) {
        toast.error(t('consultant.expenses.errors.load_failed'));
        router.push('/consultant/expenses/new');
      } finally {
        setIsLoading(false);
      }
    };

    if (expenseId) {
      fetchExpenseDetails();
    }
  }, [expenseId, router, t]);

  const getMonthBoundaries = () => {
    if (!expenseDeclaration) return { firstDay: new Date(), lastDay: new Date() };
    const month = parseInt(String(expenseDeclaration.month)) - 1;
    const year = parseInt(String(expenseDeclaration.year));
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  const isDateInSelectedMonth = (date: Date) => {
    const { firstDay, lastDay } = getMonthBoundaries();
    return date >= firstDay && date <= lastDay;
  };

  const handleFileChange = (file: UploadedFile | null) => {
    setSupportingDocument(file);
  };

  const handleExpenseSubmit = async (data: ExpenseFormValues) => {
    if (!expenseDeclaration) return;

    setIsSubmitting(true);
    try {
      const categoryName = categoryOptions.find(cat => cat.id === data.category_id)?.title || "";
      const formattedDate = format(data.date, 'yyyy-MM-dd');

      let response;
      let updatedExpense: ExpenseItem;

      if (editingExpenseId !== null) {
        response = await apiClient.put(
          apiRoutes.consultant.expenses.updateLine(editingExpenseId),
          {
            expense_id: expenseId,
            category_id: data.category_id,
            description: data.description,
            amount: data.amount,
            date: formattedDate,
            receipt_path: data.receipt_path,
            month: expenseDeclaration.month,
            year: expenseDeclaration.year
          }
        );

        if (response.data && response.data.success) {
          const expenseDetail = response.data.data.expenseDetail;
          updatedExpense = {
            id: expenseDetail.id,
            expense_id: parseInt(expenseId as string),
            category: {
              id: expenseDetail.categorie_id,
              title: categoryName
            },
            category_id: expenseDetail.categorie_id,
            categorie_id: expenseDetail.categorie_id,
            description: expenseDetail.description,
            amount: expenseDetail.ammount_ttc || 0,
            amount_ttc: expenseDetail.ammount_ttc || 0,
            day: expenseDetail.day,
            receipt_path: expenseDetail.media && expenseDetail.media.length > 0
              ? expenseDetail.media[0].file_name
              : undefined,
            media: expenseDetail.media,
            receipt_url: expenseDetail.media && expenseDetail.media.length > 0
              ? expenseDetail.media[0].original_url
              : undefined
          };

          setExpenseItems(prevItems =>
            prevItems.map(item => item.id === editingExpenseId ? updatedExpense : item)
          );
          toast.success(response.data.message || t('consultant.expenses.update_success'));
        } else {
          toast.error(response.data?.message || t('consultant.expenses.errors.update_failed'));
        }
      } else {
        response = await apiClient.post(apiRoutes.consultant.expenses.addLine, {
          expense_id: expenseId,
          category_id: data.category_id,
          description: data.description,
          amount: data.amount,
          date: formattedDate,
          receipt_path: data.receipt_path,
          month: expenseDeclaration.month,
          year: expenseDeclaration.year
        });

        if (response.data && response.data.success) {
          const expenseDetail = response.data.data.expenseDetail;
          updatedExpense = {
            id: expenseDetail.id,
            expense_id: parseInt(expenseId as string),
            category: {
              id: expenseDetail.categorie_id,
              title: categoryName
            },
            category_id: expenseDetail.categorie_id,
            categorie_id: expenseDetail.categorie_id,
            description: expenseDetail.description,
            amount: expenseDetail.ammount_ttc || 0,
            amount_ttc: expenseDetail.ammount_ttc || 0,
            day: expenseDetail.day,
            receipt_path: expenseDetail.media && expenseDetail.media.length > 0
              ? expenseDetail.media[0].file_name
              : undefined,
            media: expenseDetail.media,
            receipt_url: expenseDetail.media && expenseDetail.media.length > 0
              ? expenseDetail.media[0].original_url
              : undefined
          };

          setExpenseItems(prevItems => [...prevItems, updatedExpense]);

          toast.success(response.data.message || t('consultant.expenses.add_success'));
        } else {
          toast.error(response.data?.message || t('consultant.expenses.errors.add_failed'));
        }
      }
      setSupportingDocument(null);
      setEditingExpenseId(null);

    } catch (error) {
      toast.error(t(`consultant.expenses.errors.${editingExpenseId !== null ? 'update' : 'add'}_error`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number, showNotification = true) => {
    if (!id) {
      if (showNotification) {
        toast.error(t('consultant.expenses.errors.delete_invalid_id'));
      }
      return;
    }

    try {
      const response = await apiClient.delete(apiRoutes.consultant.expenses.deleteLine(id));

      if (response.data && response.data.success) {
        setExpenseItems(expenseItems.filter(item => item.id !== id));

        if (showNotification) {
          toast.success(t('consultant.expenses.delete_success'));
        }
        if (editingExpenseId === id) {
          setEditingExpenseId(null);
          setSupportingDocument(null);
        }
      } else {
        if (showNotification) {
          toast.error(response.data?.message || t('consultant.expenses.errors.delete_failed'));
        }
      }
    } catch (error) {
      if (showNotification) {
        toast.error(t('consultant.expenses.errors.delete_error'));
      }
    }
  };

  const handleEditExpense = (id: number) => {
    if (expenseDeclaration?.status !== 'draft') {
      toast.error(t('consultant.expenses.errors.edit_not_allowed'));
      return;
    }

    const expenseToEdit = expenseItems.find(item => item.id === id);
    if (!expenseToEdit) return;
    const expenseDate = expenseToEdit.day ? new Date(expenseToEdit.day) :
      expenseToEdit.date ? new Date(expenseToEdit.date) :
        new Date();

    const categoryId = expenseToEdit.category?.id ||
      expenseToEdit.category_id ||
      expenseToEdit.categorie_id;
    const amount = expenseToEdit.amount ||
      expenseToEdit.amount_ttc ||
      expenseToEdit.ammount_ttc ||
      0;
    let receiptPath = '';
    let receiptUrl = '';
    let mimeType = '';

    if (expenseToEdit.media && expenseToEdit.media.length > 0) {
      receiptPath = expenseToEdit.media[0].file_name;
      receiptUrl = expenseToEdit.media[0].original_url;
      mimeType = expenseToEdit.media[0].mime_type || guessFileType(receiptPath);
    } else if (expenseToEdit.receipt_path) {
      receiptPath = expenseToEdit.receipt_path;
      receiptUrl = expenseToEdit.receipt_url || '';
      mimeType = guessFileType(receiptPath);
    }
    if (receiptUrl) {
      setSupportingDocument({
        path: receiptPath,
        url: receiptUrl,
        name: getReceiptFilename(receiptPath),
        size: 0,
        mime_type: mimeType
      });
    }

    setEditingExpenseId(id);

    toast.info(t('consultant.expenses.editing_expense'));
  };

  const guessFileType = (path?: string): string => {
    if (!path) return 'application/octet-stream';

    const pathLower = path.toLowerCase();

    if (pathLower.endsWith('.pdf')) return 'application/pdf';
    if (pathLower.endsWith('.jpg') || pathLower.endsWith('.jpeg')) return 'image/jpeg';
    if (pathLower.endsWith('.png')) return 'image/png';
    if (pathLower.endsWith('.gif')) return 'image/gif';
    if (pathLower.endsWith('.webp')) return 'image/webp';
    if (pathLower.endsWith('.doc') || pathLower.endsWith('.docx')) return 'application/msword';
    if (pathLower.endsWith('.xls') || pathLower.endsWith('.xlsx')) return 'application/vnd.ms-excel';
    return 'application/octet-stream';
  };

  const getReceiptFilename = (receipt_path?: string): string => {
    if (!receipt_path) return t('consultant.expenses.no_receipt');

    const parts = receipt_path.split('/');
    return parts[parts.length - 1] || t('consultant.expenses.receipt');
  };

  const handleCancelEdit = () => {
    setSupportingDocument(null);
    setEditingExpenseId(null);
  };

  const handleDeclareExpenses = async () => {
    if (expenseItems.length === 0) {
      toast.error(t('consultant.expenses.errors.empty_declaration'));
      return;
    }

    setIsSubmittingDeclaration(true);

    try {
      const allExpenseIds = expenseItems.map(item => item.id).filter(id => id !== undefined);
      if (allExpenseIds.length === 0) {
        toast.error(t('consultant.expenses.errors.no_valid_expenses'));
        setIsSubmittingDeclaration(false);
        return;
      }

      const response = await apiClient.post(apiRoutes.consultant.expenses.declare(expenseId as string | number));
      if (response.data && response.data.success) {
        toast.success(t('consultant.expenses.declare_success'));
        router.push('/consultant/expenses');
      } else {
        toast.error(response.data?.message || t('consultant.expenses.errors.declare_failed'));
      }
    } catch (error) {
      toast.error(t('consultant.expenses.errors.declare_error'));
    } finally {
      setIsSubmittingDeclaration(false);
    }
  };
  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div className="w-1/2 h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-60 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-60 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const getFormDefaultValues = () => {
    if (editingExpenseId === null) {
      return {
        category_id: 0,
        description: '',
        amount: 0,
        date: expenseDeclaration ? new Date(
          parseInt(String(expenseDeclaration.year)),
          parseInt(String(expenseDeclaration.month)) - 1,
          1
        ) : new Date(),
        receipt_path: '',
      };
    }

    const expenseToEdit = expenseItems.find(item => item.id === editingExpenseId);
    if (!expenseToEdit) return undefined;

    let expenseDate: Date;
    if (typeof expenseToEdit.day === 'string' && expenseToEdit.day.includes('-')) {
      expenseDate = new Date(expenseToEdit.day);
    } else if (expenseToEdit.date) {
      expenseDate = new Date(expenseToEdit.date);
    } else {
      expenseDate = new Date();
    }

    const categoryId = Number(
      expenseToEdit.category?.id ||
      expenseToEdit.category_id ||
      expenseToEdit.categorie_id ||
      0
    );

    const amount = Number(
      expenseToEdit.amount ||
      expenseToEdit.amount_ttc ||
      0
    );

    let receiptPath = '';
    if (expenseToEdit.media && expenseToEdit.media.length > 0) {
      receiptPath = expenseToEdit.media[0].file_name;
    } else if (expenseToEdit.receipt_path) {
      receiptPath = expenseToEdit.receipt_path;
    }

    return {
      category_id: categoryId,
      description: expenseToEdit.description || '',
      amount: amount,
      date: expenseDate,
      receipt_path: receiptPath,
    };
  };

  const renderStatusBadge = () => {
    if (!expenseDeclaration?.status) return null;

    const status = expenseDeclaration.status.toLowerCase();
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-200 text-gray-800',
      icon: IconReceipt
    };

    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase`}>
        <IconComponent size={14} />
        {t(`consultant.expenses.status.${status}`) || config.label}
      </Badge>
    );
  };

  const renderStatusMessage = () => {
    if (!expenseDeclaration?.status || expenseDeclaration.status === 'draft') return null;

    const messages = {
      pending: {
        title: t('consultant.expenses.status_message.pending.title'),
        description: t('consultant.expenses.status_message.pending.description'),
        variant: "warning"
      },
      rejected: {
        title: t('consultant.expenses.status_message.rejected.title'),
        description: t('consultant.expenses.status_message.rejected.description'),
        variant: "destructive"
      },
      validated: {
        title: t('consultant.expenses.status_message.validated.title'),
        description: t('consultant.expenses.status_message.validated.description'),
        variant: "success"
      }
    };
    const status = expenseDeclaration.status.toLowerCase();
  };
  const isDraft = expenseDeclaration?.status === 'draft';

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p');
    } catch (e) {
      return dateString;
    }
  };

  const handleCorrectDeclaration = async () => {
    if (!expenseDeclaration) return;

    try {
      const response = await apiClient.post(apiRoutes.consultant.expenses.correct(expenseId as string));

      if (response.data && response.data.success) {
        toast.success(t('consultant.expenses.correction_success'));
        setExpenseDeclaration(prev => prev ? { ...prev, status: 'draft', id: prev.id } : null);
        setEditingExpenseId(null);
        setSupportingDocument(null);
      } else {
        toast.error(response.data?.message || t('consultant.expenses.errors.correction_failed'));
      }
    } catch (error) {
      toast.error(t('consultant.expenses.errors.correction_error'));
    }
  };

  return (
    <PageContainer>
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <Heading
                title={t('consultant.expenses.declaration_title')}
                description={
                  expenseDeclaration
                    ? `${expenseDeclaration.month_name} ${expenseDeclaration.year} - ${expenseDeclaration.mission.title}`
                    : t('consultant.expenses.loading')
                }
              />
            </div>
          </div>
          <div className='flex gap-2'>
            {renderStatusBadge()}
            <Button
              variant='outline'
              onClick={() => router.push('/consultant/expenses')}
              className='h-9'
              size='sm'
            >
              {t('consultant.expenses.back_to_list')}
            </Button>
            {isDraft && (
              <Button
                onClick={handleDeclareExpenses}
                disabled={expenseItems.length === 0 || isSubmittingDeclaration}
                className='h-9'
                size='sm'
              >
                {isSubmittingDeclaration ? (
                  <>
                    <div className='flex gap-1'>
                      <div className='h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.3s]'></div>
                      <div className='h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.15s]'></div>
                      <div className='h-1 w-1 animate-bounce rounded-full bg-white'></div>
                    </div>
                    <span className='ml-2'>{t('common.submitting')}</span>
                  </>
                ) : (
                  <>
                    <IconCheck className='mr-2 h-4 w-4' /> {t('consultant.expenses.submit_all')}
                  </>
                )}
              </Button>
            )}
            {expenseDeclaration?.status === 'rejected' && (
              <Button
                onClick={handleCorrectDeclaration}
                className='h-9'
              >
                {t('consultant.expenses.correct_declaration')}
              </Button>
            )}
          </div>
        </div>
        <Separator />
        {renderStatusMessage()}
        {isDraft && (
          <Card className='border-primary/20 shadow-sm'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <IconReceipt className='text-primary h-5 w-5' />
                {editingExpenseId !== null ? t('consultant.expenses.edit_expense') : t('consultant.expenses.add_new')}
              </CardTitle>
              <CardDescription>
                {editingExpenseId !== null
                  ? t('consultant.expenses.update_description')
                  : t('consultant.expenses.add_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <ExpenseForm
                onSubmit={handleExpenseSubmit}
                onCancelEdit={handleCancelEdit}
                isSubmitting={isSubmitting}
                isEditing={editingExpenseId !== null}
                defaultValues={getFormDefaultValues()}
                categoryOptions={categoryOptions}
                dateFilter={isDateInSelectedMonth}
                supportingDocument={supportingDocument}
                onFileChange={handleFileChange}
              />
            </CardContent>
          </Card>
        )}

        <div className='mt-6 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-lg font-medium'>
            <IconReceipt className='text-primary h-5 w-5' />
            {expenseItems.length > 0
              ? t('consultant.expenses.items_count')
              : t('consultant.expenses.no_items')}
          </div>
          {!isDraft && expenseItems.length > 0 && (
            <div className='text-primary bg-primary/10 rounded-md px-3 py-1 text-sm font-semibold'>
              {t('consultant.expenses.total')}:{' '}
              {new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
                style: 'currency',
                currency: 'EUR'
              }).format(
                expenseItems.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0
                )
              )}
            </div>
          )}
        </div>
        {rejectionHistory.length > 0 &&
          expenseDeclaration?.status === 'rejected' && (
            <Card className='border-red-200 bg-red-50 shadow-sm'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <IconFileDescription className='h-5 w-5 text-red-500' />
                  {t('consultant.expenses.rejection_history')}
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-3'>
                  {rejectionHistory.map((rejection) => (
                    <div
                      key={rejection.id}
                      className='rounded-md border border-red-100 bg-white p-3'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='text-xs text-gray-500'>
                          {formatDate(rejection.created_at)}
                        </div>
                      </div>
                      <div className='mt-1 text-sm text-gray-700'>
                        {rejection.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        <div className='mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {expenseItems.length === 0 && (
            <div className='text-muted-foreground bg-muted/30 col-span-full rounded-lg border border-dashed p-8 text-center'>
              {isDraft ? (
                <p>
                  {t('consultant.expenses.no_items_message.draft')}
                </p>
              ) : (
                <p>{t('consultant.expenses.no_items_message.other')}</p>
              )}
            </div>
          )}

          {expenseItems.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={isDraft ? handleEditExpense : undefined}
              onDelete={isDraft ? handleDeleteExpense : undefined}
              isBeingEdited={editingExpenseId === expense.id}
              readOnly={!isDraft}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}