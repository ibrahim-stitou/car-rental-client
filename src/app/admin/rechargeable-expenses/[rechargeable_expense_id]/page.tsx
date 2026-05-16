'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent } from '@/components/ui/card';
import {
  IconCheck,
  IconX,
  IconReceipt,
  IconClock,
  IconCircleCheck,
  IconRepeat,
  IconBriefcase,
  IconCalendar,
  IconCoin,
  IconExclamationCircle,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

export default function RechargeableExpenseAdminDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { rechargeable_expense_id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expense, setExpense] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!rechargeable_expense_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(
          apiRoutes.admin.rechargeableExpenses.detail(rechargeable_expense_id as string)
        );

        if (response.data?.success) {
          setExpense(response.data.data);
        } else {
          toast.error(t('admin.rechargeable_expenses.errors.load_details'));
          router.push('/admin/rechargeable-expenses');
        }
      } catch (error) {
        toast.error(t('admin.rechargeable_expenses.errors.load_details'));
        router.push('/admin/rechargeable-expenses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenseDetails();
  }, [rechargeable_expense_id, router, t]);

  const handleValidateExpense = async () => {
    if (!rechargeable_expense_id) return;

    try {
      setIsProcessing(true);
      const response = await apiClient.post(
        apiRoutes.admin.rechargeableExpenses.approve(rechargeable_expense_id as string)
      );

      if (response.data?.success) {
        toast.success(t('admin.rechargeable_expenses.success.validate'));
        setExpense((prev: any) => ({
          ...prev,
          status: 'validated',
          updated_at: new Date().toISOString(),
        }));
      } else {
        throw new Error(response.data?.message || t('admin.rechargeable_expenses.errors.validate'));
      }
    } catch (error: any) {
      toast.error(error.message || t('admin.rechargeable_expenses.errors.validate'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectExpense = async () => {
    if (!rechargeable_expense_id || !rejectionReason.trim()) return;

    try {
      setIsProcessing(true);
      const response = await apiClient.post(
        apiRoutes.admin.rechargeableExpenses.reject(rechargeable_expense_id as string),
        { reason: rejectionReason }
      );

      if (response.data?.success) {
        toast.success(t('admin.rechargeable_expenses.success.reject'));

        // Update the local state with the new rejection
        const newRejection = {
          id: Date.now(), // Temporary ID until refresh
          rejectable_type: "App\\Models\\RechargeableExpense",
          rejectable_id: rechargeable_expense_id,
          reason: rejectionReason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setExpense((prev: any) => ({
          ...prev,
          status: 'rejected',
          updated_at: new Date().toISOString(),
          rejections: [...(prev.rejections || []), newRejection],
        }));

        setIsRejectModalOpen(false);
        setRejectionReason('');
      } else {
        throw new Error(response.data?.message || t('admin.rechargeable_expenses.errors.reject'));
      }
    } catch (error: any) {
      toast.error(error.message || t('admin.rechargeable_expenses.errors.reject'));
    } finally {
      setIsProcessing(false);
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
        {t(`admin.rechargeable_expenses.status.${config.label}`)}
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(amount));
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
          <p className="text-gray-500">{t('admin.rechargeable_expenses.errors.not_found')}</p>
        </div>
      </PageContainer>
    );
  }

  const isReview = expense.status === 'review';
  const isRejected = expense.status === 'rejected';
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
                  title={t('admin.rechargeable_expenses.title')}
                  description={`${t('admin.rechargeable_expenses.subtitle')} ${expense.month}/${expense.year}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderStatusBadge()}

              <Button
                variant="outline"
                onClick={() => router.push('/admin/rechargeable-expenses')}
                className="h-9"
                size="sm"
              >
                {t('admin.rechargeable_expenses.buttons.back')}
              </Button>

              {isReview && (
                <>
                  <Button
                    onClick={handleValidateExpense}
                    className="h-9"
                    size="sm"
                    disabled={isProcessing}
                  >
                    <IconCheck className="mr-2 h-4 w-4" />
                    {t('admin.rechargeable_expenses.buttons.validate')}
                  </Button>
                  <Button
                    onClick={handleOpenRejectModal}
                    className="h-9"
                    size="sm"
                    disabled={isProcessing}
                    variant="destructive"
                  >
                    <IconX className="mr-2 h-4 w-4" />
                    {t('admin.rechargeable_expenses.buttons.reject')}
                  </Button>
                </>
              )}
            </div>
          </div>


          <div className="flex flex-wrap gap-6 text-sm">
            {expense.mission && (
              <div className="flex items-center gap-2">
                <IconBriefcase className="h-4 w-4 text-slate-400" />
                <div>
                  <span className="text-muted-foreground mr-1">
                    {t('admin.rechargeable_expenses.labels.mission')}:
                  </span>
                  <span className="font-medium">{expense.mission.title}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-muted-foreground mr-1">
                  {t('admin.rechargeable_expenses.labels.period')}:
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
                  {t('admin.rechargeable_expenses.labels.created')}:
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
        {hasRejections && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-lg font-medium text-red-700">
              <IconExclamationCircle className="h-5 w-5" />
              {t('admin.rechargeable_expenses.labels.rejection_history')}
            </div>
            <div className="space-y-3">
              {expense.rejections.map((rejection: any) => (
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

        <div className="mt-10">
          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-lg font-medium">
              <IconCoin className="text-primary h-5 w-5" />
              {expense.lignes?.length > 0
                ? `${t('admin.rechargeable_expenses.labels.expense_lines_count')} (${expense.lignes.length})`
                : t('admin.rechargeable_expenses.labels.no_expense_lines')}
            </div>
            {expense.lignes?.length > 0 && (
              <div className="flex gap-3">
                <div className="rounded-md bg-blue-50 px-3 py-1 text-sm">
                  <span className="text-gray-500">
                    {t('admin.rechargeable_expenses.labels.total_amount')}:
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(expense.total_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Card className="overflow-hidden p-0 rounded-sm">
            <CardContent className="p-0 ">
              {expense.lignes?.length > 0 ? (
                <div className="overflow-hidden p-0">
                  <Table className="p-0">
                    <TableHeader className="bg-gray-50 p-0">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          {t('admin.rechargeable_expenses.labels.date')}
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          {t('admin.rechargeable_expenses.labels.nature')}
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          {t('admin.rechargeable_expenses.labels.comment')}
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">
                          {t('admin.rechargeable_expenses.labels.amount')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expense.lignes.map((line: { id: string; date: string; nature: string; commentaire?: string; amount: string }) => (
                        <TableRow key={line.id} className="hover:bg-gray-50">
                          <TableCell className="text-sm text-gray-700">
                            {formatDate(line.date)}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{line.nature}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {line.commentaire || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {formatCurrency(line.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground rounded-lg border border-dashed bg-gray-50 p-6 text-center">
                  <p>{t('admin.rechargeable_expenses.messages.no_lines_found')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rejection Modal */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.rechargeable_expenses.modal.reject_title')}</DialogTitle>
              <DialogDescription>
                {t('admin.rechargeable_expenses.modal.reject_description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  {t('admin.rechargeable_expenses.modal.rejection_reason')}*
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('admin.rechargeable_expenses.modal.rejection_reason_placeholder')}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isProcessing}
              >
                {t('admin.rechargeable_expenses.buttons.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRejectExpense}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? t('admin.rechargeable_expenses.buttons.processing') : t('admin.rechargeable_expenses.buttons.confirm_reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}