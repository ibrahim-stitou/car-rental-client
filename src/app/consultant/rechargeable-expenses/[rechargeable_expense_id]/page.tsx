'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import {
  IconCheck,
  IconReceipt,
  IconClock,
  IconX,
  IconCash,
  IconCalendar,
  IconCircleCheck,
  IconBriefcase,
  IconUser,
  IconCoin,
  IconRepeat,
  IconAlertTriangle,
  IconPencil
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import RechargeableExpensesForm, { RechargeableExpenseLineFormValues } from '@/features/consultant/rechargeable-expenses/components/rechargeable-expense-form';
import { useLanguage } from '@/context/LanguageContext';

interface RechargeableExpenseLine {
  id: number;
  date: string;
  nature: string;
  amount: string;
  commentaire: string;
  created_at: string;
  updated_at: string;
}

interface Mission {
  id: number;
  title: string;
  client_id: number;
  user_id: number;
  status: string;
  tjm: string;
  tjm_type: string;
  date_debut: string;
  date_fin: string;
  description: string;
  country_id: number;
  adresse_prin: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Rejection {
  id: number;
  rejectable_type: string;
  rejectable_id: number;
  reason: string;
  created_at: string;
  updated_at: string;
}

interface RechargeableExpense {
  id: number;
  mission_id: number;
  year: string;
  month: number;
  status: string;
  consultant_id: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
  lignes: RechargeableExpenseLine[];
  mission: Mission;
  rejections?: Rejection[];
}

const STATUS_CONFIG = {
  draft: {
    label: 'draft',
    color: 'bg-slate-200 text-slate-800',
    icon: IconReceipt,
  },
  review: {
    label: 'review',
    color: 'bg-amber-100 text-amber-800',
    icon: IconClock,
  },
  validated: {
    label: 'validated',
    color: 'bg-green-100 text-green-800',
    icon: IconCircleCheck,
  },
  rejected: {
    label: 'rejected',
    color: 'bg-red-100 text-red-800',
    icon: IconX,
  },
  corrected: {
    label: 'corrected',
    color: 'bg-blue-100 text-blue-800',
    icon: IconRepeat,
  },
};

export default function RechargeableExpenseEntryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { rechargeable_expense_id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseLines, setExpenseLines] = useState<RechargeableExpenseLine[]>([]);
  const [expense, setExpense] = useState<RechargeableExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLine, setSelectedLine] = useState<RechargeableExpenseLine | null>(null);

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!rechargeable_expense_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(
          apiRoutes.consultant.rechargeableExpenses.detail(rechargeable_expense_id as string)
        );

        if (response.data?.success) {
          const expenseData = response.data.data;
          setExpense(expenseData);
          setExpenseLines(expenseData.lignes || []);
        } else {
          toast.error(t('consultant.rechargeable_expense.errors.load_details'));
          router.push('/admin/rechargeable-expenses');
        }
      } catch (error) {
        toast.error(t('consultant.rechargeable_expense.errors.load_details'));
        router.push('/admin/rechargeable-expenses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenseDetails();
  }, [rechargeable_expense_id, router, t]);

  const handleDeclareExpense = async () => {
    if (!rechargeable_expense_id) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.consultant.rechargeableExpenses.declare(rechargeable_expense_id as string)
      );

      if (response.data?.success) {
        toast.success(t('consultant.rechargeable_expense.success.declare'));
        setExpense((prev) => ({
          ...prev!,
          ...response.data.data,
          status: 'review',
        }));
      } else {
        throw new Error(response.data?.message || t('consultant.rechargeable_expense.errors.declare'));
      }
    } catch (error: any) {
      toast.error(error.message || t('consultant.rechargeable_expense.errors.declare'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectExpense = async () => {
    if (!rechargeable_expense_id) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.consultant.rechargeableExpenses.correct(rechargeable_expense_id as string)
      );

      if (response.data?.success) {
        toast.success(t('consultant.rechargeable_expense.success.correct'));
        setExpense((prev) => ({
          ...prev!,
          ...response.data.data,
          status: 'draft',
        }));
      } else {
        throw new Error(response.data?.message || t('consultant.rechargeable_expense.errors.correct'));
      }
    } catch (error: any) {
      toast.error(error.message || t('consultant.rechargeable_expense.errors.correct'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpenseLine = async (data: RechargeableExpenseLineFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.consultant.rechargeableExpenses.lines.create(rechargeable_expense_id as string),
        data
      );
      if (response.data?.success) {
        setExpenseLines((prev) => [...prev, response.data.data]);
        setExpense((prev) => ({
          ...prev!,
          total_amount: response.data.total_amount,
        }));
        toast.success(t('consultant.rechargeable_expense.success.add_line'));
      } else {
        throw new Error(response.data?.message || t('consultant.rechargeable_expense.errors.add_line'));
      }
    } catch (error: any) {
      toast.error(error.message || t('consultant.rechargeable_expense.errors.add_line'));
    } finally {
      setIsSubmitting(false);
      setIsFormOpen(false);
    }
  };

  const handleEditExpenseLine = async (data: RechargeableExpenseLineFormValues) => {
    if (!selectedLine) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.put(
        apiRoutes.consultant.rechargeableExpenses.lines.update(selectedLine.id),
        data
      );

      if (response.data?.success) {
        setExpenseLines((prev) =>
          prev.map((line) => (line.id === selectedLine.id ? response.data.data : line))
        );
        setExpense((prev) => ({
          ...prev!,
          total_amount: response.data.total_amount,
        }));
        toast.success(t('consultant.rechargeable_expense.success.update_line'));
      } else {
        throw new Error(response.data?.message || t('consultant.rechargeable_expense.errors.update_line'));
      }
    } catch (error: any) {
      toast.error(error.message || t('consultant.rechargeable_expense.errors.update_line'));
    } finally {
      setIsSubmitting(false);
      setIsFormOpen(false);
      setIsEditing(false);
      setSelectedLine(null);
    }
  };

  const handleDeleteExpenseLine = async (lineId: number) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.delete(
        apiRoutes.consultant.rechargeableExpenses.lines.delete(lineId)
      );

      if (response.data?.success) {
        setExpenseLines((prev) => prev.filter((line) => line.id !== lineId));
        setExpense((prev) => ({
          ...prev!,
          total_amount: response.data.total_amount,
        }));
        toast.success(t('consultant.rechargeable_expense.success.delete_line'));
      } else {
        throw new Error(response.data?.message || t('consultant.rechargeable_expense.errors.delete_line'));
      }
    } catch (error: any) {
      toast.error(error.message || t('consultant.rechargeable_expense.errors.delete_line'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    if (!expense?.status) return null;

    const status = expense.status.toLowerCase();
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: 'bg-gray-200 text-gray-800',
      icon: IconReceipt,
    };

    const IconComponent = config.icon;

    return (
      <Badge
        className={`${config.color} flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase`}
      >
        <IconComponent size={14} />
        {t(`consultant.rechargeable_expense.status.${config.label}`)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-1/2 animate-pulse rounded bg-gray-200"></div>
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-60 animate-pulse rounded bg-gray-200"></div>
            <div className="h-60 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!expense) {
    return (
      <PageContainer>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">{t('consultant.rechargeable_expense.errors.not_found')}</p>
        </div>
      </PageContainer>
    );
  }

  const isDraft = expense.status === 'draft';
  const isRejected = expense.status === 'rejected';
  const isEditable = isDraft || isRejected;
  const totalAmount = parseFloat(expense.total_amount || '0');
  const hasRejections = expense.rejections && expense.rejections.length > 0;

  return (
    <PageContainer>
      <div className="w-full space-y-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-3 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Heading
                  title={t('consultant.rechargeable_expense.title')}
                  //@ts-ignore
                  description={`${t('consultant.rechargeable_expense.subtitle')} ${expense.month}/${expense.year}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderStatusBadge()}

              <Button
                variant="outline"
                onClick={() => router.push('/consultant/rechargeable-expenses')}
                className="h-9"
                size="sm"
              >
                {t('consultant.rechargeable_expense.buttons.back')}
              </Button>

              {isDraft && (
                <Button
                  onClick={handleDeclareExpense}
                  className="h-9"
                  size="sm"
                  disabled={isSubmitting || expenseLines.length === 0}
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  {t('consultant.rechargeable_expense.buttons.declare')}
                </Button>
              )}

              {isRejected && (
                <Button
                  onClick={handleCorrectExpense}
                  className="h-9"
                  size="sm"
                  disabled={isSubmitting || expenseLines.length === 0}
                  variant="secondary"
                >
                  <IconRepeat className="mr-2 h-4 w-4" />
                  {t('consultant.rechargeable_expense.buttons.correct')}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            {expense.mission && (
              <div className="flex items-center gap-2">
                <IconBriefcase className="h-4 w-4 text-slate-400" />
                <div>
                  <span className="text-muted-foreground mr-1">
                    {t('consultant.rechargeable_expense.labels.mission')}:
                  </span>
                  <span className="font-medium">{expense.mission.title}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-muted-foreground mr-1">
                  {t('consultant.rechargeable_expense.labels.period')}:
                </span>
                <span className="font-medium">
                  {expense.month}/{expense.year}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-muted-foreground mr-1">
                  {t('consultant.rechargeable_expense.labels.created')}:
                </span>
                <span className="font-medium">
                  {expense.created_at ? formatDate(expense.created_at) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-1" />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Rejection History Section */}
        {isRejected && hasRejections && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-lg font-medium text-red-700">
              <IconAlertTriangle className="h-5 w-5" />
              {t('consultant.rechargeable_expense.labels.rejection_history')}
            </div>
            <div className="space-y-3">
              {expense.rejections?.map((rejection) => (
                <div key={rejection.id} className="rounded-md bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {formatDate(rejection.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rejection.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditable && (
          <RechargeableExpensesForm
            //@ts-ignore
            onSubmit={isEditing ? handleEditExpenseLine : handleAddExpenseLine}
            onCancelEdit={() => {
              setIsFormOpen(false);
              setIsEditing(false);
              setSelectedLine(null);
            }}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            defaultValues={isEditing ? selectedLine : undefined}
            month={expense.month}
            year={expense.year}
          />
        )}

        <div className="mt-4">
          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-lg font-medium">
              <IconCoin className="text-primary h-5 w-5" />
              {expenseLines.length > 0
                //@ts-ignore
                ? `${t('consultant.rechargeable_expense.labels.expense_lines_count')} (${expenseLines.length})`
                : t('consultant.rechargeable_expense.labels.no_expense_lines')}
            </div>
            {expenseLines.length > 0 && (
              <div className="flex gap-3">
                <div className="rounded-md bg-blue-50 px-3 py-1 text-sm">
                  <span className="text-gray-500">
                    {t('consultant.rechargeable_expense.labels.total_amount')}:
                  </span>
                  <span className="font-semibold text-blue-600">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(totalAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {expenseLines.length > 0 ? (
            <div className="overflow-hidden rounded-md border shadow-sm">
              <div className="grid grid-cols-12 gap-4 bg-gray-50 p-3 text-xs font-medium text-gray-500">
                <div className="col-span-2">
                  {t('consultant.rechargeable_expense.labels.date')}
                </div>
                <div className="col-span-3">
                  {t('consultant.rechargeable_expense.labels.nature')}
                </div>
                <div className="col-span-3">
                  {t('consultant.rechargeable_expense.labels.comment')}
                </div>
                <div className="col-span-2 text-right">
                  {t('consultant.rechargeable_expense.labels.amount')}
                </div>
                <div className="col-span-2"></div>
              </div>
              <div>
                {expenseLines.map((line, index) => (
                  <div
                    key={line.id}
                    className={`grid grid-cols-12 gap-4 p-3 text-sm ${
                      index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="col-span-2">{formatDate(line.date)}</div>
                    <div className="col-span-3 font-medium">{line.nature}</div>
                    <div className="col-span-3 text-gray-600">{line.commentaire}</div>
                    <div className="col-span-2 text-right font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(parseFloat(line.amount))}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      {isEditable && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              setSelectedLine(line);
                              setIsEditing(true);
                              setIsFormOpen(true);
                            }}
                          >
                            <IconPencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDeleteExpenseLine(line.id)}
                          >
                            <IconX className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed bg-gray-50 p-6 text-center">
              {isEditable ? (
                <p>{t('consultant.rechargeable_expense.messages.no_lines_added')}</p>
              ) : (
                <p>{t('consultant.rechargeable_expense.messages.no_lines_found')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}