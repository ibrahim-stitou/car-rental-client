'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from "date-fns";
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import {
  IconReceipt,
  IconClock,
  IconX,
  IconCircleCheck,
  IconCheck,
  IconFileDescription
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import ExpenseCard, { ExpenseItem } from '@/features/consultant/expenses/components/expense-card-component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectionHistory {
  id: string | number;
  reason: string;
  created_at: string;
}
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
  consultant: {
    id: string | number;
    name: string;
    email?: string;
    full_name:string;
  };
  status: string;
  details?: ExpenseItem[];
  rejection_history?: RejectionHistory[];
}
const getMonthName = (monthNumber: number | string, t: any): string => {
  const monthNum = typeof monthNumber === 'string' ? parseInt(monthNumber) : monthNumber;
  return t(`months.${monthNum}`);
};

export default function AdminExpensePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { expenseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseDeclaration, setExpenseDeclaration] = useState<ExpenseDeclaration | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionHistory, setRejectionHistory] = useState<RejectionHistory[]>([]);

  const STATUS_CONFIG = {
    draft: {
      label: t('admin.expenses.status.draft'),
      color: 'bg-slate-200 text-slate-800',
      icon: IconReceipt
    },
    pending: {
      label: t('admin.expenses.status.pending'),
      color: 'bg-yellow-100 text-yellow-800',
      icon: IconClock
    },
    rejected: {
      label: t('admin.expenses.status.rejected'),
      color: 'bg-red-100 text-red-800',
      icon: IconX
    },
    validated: {
      label: t('admin.expenses.status.approved'),
      color: 'bg-green-100 text-green-800',
      icon: IconCircleCheck
    }
  };

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      setIsLoading(true);
      try {
        const declarationResponse = await apiClient.get(
          apiRoutes.admin.expenses.detail(expenseId as string)
        );

        if (declarationResponse.data?.success) {
          const expenseData = declarationResponse.data.data.expense;
          if (!expenseData.month_name) {
            expenseData.month_name = getMonthName(expenseData.month, t);
          }

          setExpenseDeclaration(expenseData);
          if (expenseData.rejections && Array.isArray(expenseData.rejections)) {
            setRejectionHistory(expenseData.rejections);
          }
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
              category_name: detail.category_name,
              receipt_url: detail.media && detail.media.length > 0 ? detail.media[0].original_url : undefined,
              receipt_path: detail.media && detail.media.length > 0 ? detail.media[0].file_name : undefined,
              media: detail.media,
            }));
            setExpenseItems(mappedItems);
          }
        } else {
          toast.error(t('admin.expenses.show.failedToLoad'));
          router.push('/admin/expenses');
        }
      } catch (error) {
        toast.error(t('admin.expenses.show.failedToLoad'));
        router.push('/admin/expenses');
      } finally {
        setIsLoading(false);
      }
    };

    if (expenseId) {
      fetchExpenseDetails();
    }
  }, [expenseId, router, t]);
  const handleValidateExpense = async () => {
    if (!expenseDeclaration) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.post(apiRoutes.admin.expenses.approve(expenseId as string));

      if (response.data && response.data.success) {
        toast.success(t('admin.expenses.show.validateSuccess'));
        setExpenseDeclaration({
          ...expenseDeclaration,
          status: 'validated'
        });
      } else {
        toast.error(response.data?.message || t('admin.expenses.show.validateError'));
      }
    } catch (error) {
      toast.error(t('admin.expenses.show.validateErrorGeneric'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectExpense = async () => {
    if (!expenseDeclaration || !rejectionReason.trim()) {
      toast.error(t('admin.expenses.show.reasonRequired'));
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.post(apiRoutes.admin.expenses.reject(expenseId as string), {
        rejection_reason: rejectionReason
      });

      if (response.data && response.data.success) {
        toast.success(t('admin.expenses.show.rejectSuccess'));
        //@ts-ignore
        const newRejection: RejectionHistory = {
          id: Date.now(),
          reason: rejectionReason,
        };

        setRejectionHistory([newRejection, ...rejectionHistory]);
        setExpenseDeclaration({
          ...expenseDeclaration,
          status: 'rejected'
        });

        setIsRejectDialogOpen(false);
        setRejectionReason('');
      } else {
        toast.error(response.data?.message || t('admin.expenses.show.rejectError'));
      }
    } catch (error) {
      toast.error(t('admin.expenses.show.rejectErrorGeneric'));
    } finally {
      setIsProcessing(false);
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
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p');
    } catch (e) {
      return dateString;
    }
  };
  const canPerformActions = expenseDeclaration?.status === 'pending';

  return (
    <PageContainer>
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Heading
                title={t('admin.expenses.show.title')}
                description={expenseDeclaration ?
                  //@ts-ignore
                  `${expenseDeclaration.month_name} ${expenseDeclaration.year} - ${expenseDeclaration.mission.title} - ${expenseDeclaration.consultant.nom} ${expenseDeclaration.consultant.prenom}` :
                  t('admin.expenses.show.loading')}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {renderStatusBadge()}
            <Button
              variant="outline"
              onClick={() => router.push('/admin/expenses')}
              className="h-9"
              size="sm"
            >
              {t('admin.expenses.show.back')}
            </Button>
            {canPerformActions && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejectDialogOpen(true)}
                  disabled={isProcessing}
                  className="h-9"
                  size="sm"
                >
                  <IconX className="mr-2 h-4 w-4" /> {t('admin.expenses.show.reject')}
                </Button>
                <Button
                  onClick={handleValidateExpense}
                  disabled={isProcessing}
                  className="h-9"
                  size="sm"
                >
                  {isProcessing && expenseDeclaration?.status !== 'validated' ? (
                    <>
                      <div className="flex gap-1">
                        <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
                      </div>
                      <span className="ml-2">{t('admin.expenses.show.processing')}</span>
                    </>
                  ) : (
                    <>
                      <IconCheck className="mr-2 h-4 w-4" /> {t('admin.expenses.show.validate')}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        <Separator />

        {/* Rejection History Section */}
        {rejectionHistory.length > 0 && (
          <Card className="shadow-sm border-red-200 bg-red-50">
            <CardHeader className="">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconFileDescription className="h-5 w-5 text-red-500" />
                {t('admin.expenses.show.rejectionHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {rejectionHistory.map((rejection, index) => (
                  <div key={rejection.id} className="p-3 bg-white rounded-md border border-red-100">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-gray-500">
                        {formatDate(rejection.created_at)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {rejection.reason}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declaration Summary */}
        <Card className="shadow-sm py-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {t('admin.expenses.show.declarationSummary')}
            </CardTitle>
            <CardDescription>
              {`${t('admin.expenses.show.reviewDescription')}${expenseDeclaration?.consultant.full_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('admin.expenses.table.mission')}</h4>
                <p className="text-base">{expenseDeclaration?.mission.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('admin.expenses.show.period')}</h4>
                <p className="text-base">{expenseDeclaration?.month_name} {expenseDeclaration?.year}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('admin.expenses.table.consultant')}</h4>
                <p className="text-base">{expenseDeclaration?.consultant.full_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t('admin.expenses.show.totalAmount')}</h4>
                <p className="text-base font-medium">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
                    .format(expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List Header */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-lg font-medium flex items-center gap-2">
            <IconReceipt className="h-5 w-5 text-primary" />
            {expenseItems.length > 0
              ? `${t('admin.expenses.show.expensesCount')} ${expenseItems.length}`
              : t('admin.expenses.show.noExpenses')}
          </div>
        </div>

        {/* Expense Items List */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 mt-2">
          {expenseItems.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <p>{t('admin.expenses.show.noExpensesFound')}</p>
            </div>
          )}

          {expenseItems.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              readOnly={true}
            />
          ))}
        </div>
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('admin.expenses.show.rejectDialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.expenses.show.rejectDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-right">
                {t('admin.expenses.show.rejectionReason')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder={t('admin.expenses.show.rejectionReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px]"
              />
              {rejectionReason.trim() === '' && (
                <p className="text-sm text-red-500">{t('admin.expenses.show.reasonRequired')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectExpense}
              disabled={isProcessing || rejectionReason.trim() === ''}
            >
              {isProcessing ? (
                <>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1 w-1 rounded-full bg-white animate-bounce"></div>
                  </div>
                  <span className="ml-2">{t('admin.expenses.show.processing')}</span>
                </>
              ) : (
                t('admin.expenses.show.confirmRejection')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}