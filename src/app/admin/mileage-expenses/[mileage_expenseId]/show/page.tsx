'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import {
  IconCheck,
  IconReceipt,
  IconClock,
  IconX,
  IconCircleCheck,
  IconMap,
  IconMapPin,
  IconSignature,
  IconFile,
  IconFileText,
  IconThumbUp,
  IconThumbDown,
  IconHistory
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import MileageExpenseCard from '@/features/consultant/mileage-expenses/components/mileage-expense-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Media {
  id: number;
  file_name: string;
  original_url: string;
  mime_type: string;
}

interface MileageExpenseItem {
  id: number;
  mileage_expense_id: number;
  from_adresse: string;
  to_adresse: string;
  description: string;
  day: string;
  total_km: number | string;
  total_price: number | string;
}

interface RejectionHistory {
  id: string | number;
  reason: string;
  created_at: string;
}

interface MileageExpenseDeclaration {
  id: string;
  month: string | number;
  month_name?: string;
  year: string | number;
  amount_ttc: number | null;
  total_km: number | null;
  mission: {
    id: string | number;
    title: string;
  };
  consultant: {
    id: string | number;
    full_name: string;
    email: string;
  };
  status: string;
  mileage_expense_details?: MileageExpenseItem[];
  rejections?: RejectionHistory[];
  signature_url?: string;
  media?: Media[];
}

export default function MileageExpenseAdminPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { mileage_expenseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expenseDeclaration, setExpenseDeclaration] = useState<MileageExpenseDeclaration | null>(null);
  const [mileageExpenseItems, setMileageExpenseItems] = useState<MileageExpenseItem[]>([]);
  const [rejectionHistory, setRejectionHistory] = useState<RejectionHistory[]>([]);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [filePreviewName, setFilePreviewName] = useState<string>('');
  const [filePreviewType, setFilePreviewType] = useState<string>('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRejectionHistoryOpen, setIsRejectionHistoryOpen] = useState(false);

  const STATUS_CONFIG = {
    draft: {
      label: t('admin.mileageExpenses.status.draft') || 'Draft',
      color: 'bg-slate-200 text-slate-800',
      icon: IconReceipt
    },
    to_sign: {
      label: t('admin.mileageExpenses.status.toSign') || 'Waiting for Signature',
      color: 'bg-blue-100 text-blue-800',
      icon: IconSignature
    },
    pending: {
      label: t('admin.mileageExpenses.status.pending') || 'Pending Approval',
      color: 'bg-yellow-100 text-yellow-800',
      icon: IconClock
    },
    rejected: {
      label: t('admin.mileageExpenses.status.rejected') || 'Rejected',
      color: 'bg-red-100 text-red-800',
      icon: IconX
    },
    validated: {
      label: t('admin.mileageExpenses.status.validated') || 'Validated',
      color: 'bg-green-100 text-green-800',
      icon: IconCircleCheck
    }
  };

  const rejectFormSchema = z.object({
    reason: z.string().min(5, t('admin.mileageExpenses.show.reasonRequired') || 'Rejection reason must be at least 5 characters')
  });

  const rejectForm = useForm({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      reason: ''
    }
  });

  const getMonthName = (monthNumber: number | string): string => {
    const monthNum =
      typeof monthNumber === 'string' ? parseInt(monthNumber) : monthNumber;
    return t(`months.${monthNum}`) || `Month ${monthNum}`;
  };

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!mileage_expenseId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const declarationResponse = await apiClient.get(
          apiRoutes.admin.mileageExpenses.detail(mileage_expenseId as string)
        );

        if (declarationResponse.data?.success) {
          const expenseData = declarationResponse.data.data.expense;
          if (!expenseData.month_name) {
            expenseData.month_name = getMonthName(expenseData.month);
          }
          if (expenseData.rejections && Array.isArray(expenseData.rejections)) {
            setRejectionHistory(expenseData.rejections);
          }
          setExpenseDeclaration(expenseData);
          if (
            expenseData.mileage_expense_details &&
            Array.isArray(expenseData.mileage_expense_details)
          ) {
            setMileageExpenseItems(expenseData.mileage_expense_details);
          } else {
            setMileageExpenseItems([]);
          }
        } else {
          toast.error(t('admin.mileageExpenses.show.failedToLoad') || 'Failed to load mileage expense declaration details');
          router.push('/admin/mileage-expenses');
        }
      } catch (error) {
        toast.error(t('admin.mileageExpenses.show.failedToLoad') || 'Failed to load mileage expense details');
        router.push('/admin/mileage-expenses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenseDetails();
  }, [mileage_expenseId, router, t]);

  // Get signed document information
  const getSignedDocument = () => {
    if (expenseDeclaration?.media && expenseDeclaration.media.length > 0) {
      return expenseDeclaration.media[0];
    }
    return null;
  };

  // Check if there's a signed document
  const hasSignedDocument = () => {
    return getSignedDocument() !== null;
  };

  // Open file preview dialog with document info
  const handleViewSignedDocument = () => {
    const document = getSignedDocument();
    if (document) {
      setFilePreviewUrl(document.original_url);
      setFilePreviewName(document.file_name);
      setFilePreviewType(document.mime_type);
      setIsFilePreviewOpen(true);
    } else {
      toast.error(t('admin.mileageExpenses.show.noSignedDocument') || 'Signed document not available');
    }
  };

  // Check if file is an image
  const isFileImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const handleValidateExpense = async () => {
    if (!expenseDeclaration) return;
    setIsProcessing(true);

    try {
      const response = await apiClient.post(
        apiRoutes.admin.mileageExpenses.approve(mileage_expenseId as string)
      );

      if (response.data?.success) {
        toast.success(t('admin.mileageExpenses.show.validateSuccess') || 'Mileage expense declaration validated successfully');
        setExpenseDeclaration(prev => prev ? { ...prev, status: 'validated' } : null);
      } else {
        toast.error(response.data?.message || t('admin.mileageExpenses.show.validateError') || 'Failed to validate mileage expense declaration');
      }
    } catch (error) {
      toast.error(t('admin.mileageExpenses.show.validateErrorGeneric') || 'An error occurred when validating the mileage expense declaration');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectExpense = async (data: { reason: string }) => {
    if (!expenseDeclaration) return;
    setIsProcessing(true);

    try {
      const response = await apiClient.post(
        apiRoutes.admin.mileageExpenses.reject(mileage_expenseId as string),
        { reason: data.reason }
      );

      if (response.data?.success) {
        toast.success(t('admin.mileageExpenses.show.rejectSuccess') || 'Mileage expense declaration rejected successfully');
        setExpenseDeclaration(prev => prev ? { ...prev, status: 'rejected' } : null);

        // Add the new rejection to history
        if (response.data.data?.rejection) {
          setRejectionHistory(prev => [response.data.data.rejection, ...prev]);
        }

        setIsRejectDialogOpen(false);
        rejectForm.reset();
      } else {
        toast.error(response.data?.message || t('admin.mileageExpenses.show.rejectError') || 'Failed to reject mileage expense declaration');
      }
    } catch (error) {
      toast.error(t('admin.mileageExpenses.show.rejectErrorGeneric') || 'An error occurred when rejecting the mileage expense declaration');
    } finally {
      setIsProcessing(false);
    }
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
      <Badge
        className={`${config.color} flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase`}
      >
        <IconComponent size={14} />
        {config.label}
      </Badge>
    );
  };

  const renderStatusMessage = () => {
    if (!expenseDeclaration?.status) return null;

    const messages = {
      draft: {
        title: t('admin.mileageExpenses.statusMessages.draft.title') || 'Draft Declaration',
        description: t('admin.mileageExpenses.statusMessages.draft.description') || 'This declaration is still in draft mode and has not been submitted.',
        variant: 'default'
      },
      to_sign: {
        title: t('admin.mileageExpenses.statusMessages.toSign.title') || 'Waiting for Signature',
        description: t('admin.mileageExpenses.statusMessages.toSign.description') || 'This declaration has been submitted and is waiting for the consultant\'s signature.',
        variant: 'info'
      },
      pending: {
        title: t('admin.mileageExpenses.statusMessages.pending.title') || 'Pending Your Review',
        description: t('admin.mileageExpenses.statusMessages.pending.description') || 'This mileage expense declaration is waiting for your review and approval.',
        variant: 'warning'
      },
      rejected: {
        title: t('admin.mileageExpenses.statusMessages.rejected.title') || 'Declaration Rejected',
        description: t('admin.mileageExpenses.statusMessages.rejected.description') || 'This declaration has been rejected. The consultant can make corrections and resubmit.',
        variant: 'destructive'
      },
      validated: {
        title: t('admin.mileageExpenses.statusMessages.validated.title') || 'Declaration Approved',
        description: t('admin.mileageExpenses.statusMessages.validated.description') || 'This mileage expense declaration has been approved.',
        variant: 'success'
      }
    };

    const status = expenseDeclaration.status.toLowerCase();
    const message = messages[status as keyof typeof messages];

    if (!message) return null;

    return (
      <Card
        className={`${
          status === 'rejected'
            ? 'border-red-200 bg-red-50'
            : status === 'validated'
              ? 'border-green-200 bg-green-50'
              : status === 'to_sign'
                ? 'border-blue-200 bg-blue-50'
                : status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
        } mb-4`}
      >
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg'>{message.title}</CardTitle>
          <CardDescription>{message.description}</CardDescription>
        </CardHeader>
        {status === 'pending' && (
          <CardFooter className='pt-0 flex gap-2'>
            <Button
              variant='default'
              size='sm'
              onClick={handleValidateExpense}
              disabled={isProcessing}
            >
              <IconThumbUp size={16} className="mr-2" />
              {t('admin.mileageExpenses.show.validate') || 'Validate Declaration'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isProcessing}
            >
              <IconThumbDown size={16} className="mr-2" />
              {t('admin.mileageExpenses.show.reject') || 'Reject Declaration'}
            </Button>
          </CardFooter>
        )}
      </Card>
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

  // Calculate totals
  const totalKm = mileageExpenseItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.total_km)) || 0),
    0
  );

  const totalAmount = mileageExpenseItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.total_price)) || 0),
    0
  );

  if (isLoading) {
    return (
      <PageContainer>
        <div className='w-full space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='h-8 w-1/2 animate-pulse rounded bg-gray-200'></div>
            <div className='h-8 w-20 animate-pulse rounded bg-gray-200'></div>
          </div>
          <Separator />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='h-60 animate-pulse rounded bg-gray-200'></div>
            <div className='h-60 animate-pulse rounded bg-gray-200'></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <Heading
                title={t('admin.mileageExpenses.show.title') || 'Mileage Expense Declaration Review'}
                description={
                  expenseDeclaration
                    ? `${expenseDeclaration.month_name} ${expenseDeclaration.year} - ${expenseDeclaration.mission.title}`
                    : t('admin.mileageExpenses.show.loading') || 'Loading mileage expense details...'
                }
              />
            </div>
          </div>
          <div className='flex gap-2'>
            {renderStatusBadge()}
            <Button
              variant='outline'
              onClick={() => router.push('/admin/mileage-expenses')}
              className='h-9'
              size='sm'
            >
              {t('admin.mileageExpenses.show.back') || 'Back to Mileage Expenses List'}
            </Button>
            {hasSignedDocument() && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleViewSignedDocument}
                className='h-9 flex items-center gap-1'
              >
                <IconFileText size={16} />
                {t('admin.mileageExpenses.show.viewSignedDocument') || 'View Signed Document'}
              </Button>
            )}
            {rejectionHistory.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsRejectionHistoryOpen(true)}
                className='h-9 flex items-center gap-1'
              >
                <IconHistory size={16} />
                {t('admin.mileageExpenses.show.rejectionHistory') || 'Rejection History'}
              </Button>
            )}
          </div>
        </div>
        <Separator />

        {renderStatusMessage()}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>{t('admin.mileageExpenses.show.consultantDetails') || 'Consultant Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.form.name') || 'Name'}:</span>
                  <span className='text-sm font-medium'>{expenseDeclaration?.consultant?.full_name}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.form.email') || 'Email'}:</span>
                  <span className='text-sm font-medium'>{expenseDeclaration?.consultant?.email}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.form.mission') || 'Mission'}:</span>
                  <span className='text-sm font-medium'>{expenseDeclaration?.mission?.title}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.show.period') || 'Period'}:</span>
                  <span className='text-sm font-medium'>
                    {expenseDeclaration?.month_name} {expenseDeclaration?.year}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>{t('admin.mileageExpenses.show.expenseDetails') || 'Expense Details'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.table.status') || 'Status'}:</span>
                  <span className='text-sm font-medium'>
                    {expenseDeclaration?.status && STATUS_CONFIG[expenseDeclaration.status.toLowerCase() as keyof typeof STATUS_CONFIG]
                      ? STATUS_CONFIG[expenseDeclaration.status.toLowerCase() as keyof typeof STATUS_CONFIG].label
                      : expenseDeclaration?.status}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.table.totalKm') || 'Total Distance'}:</span>
                  <span className='text-sm font-medium'>{totalKm.toFixed(2)} km</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.table.amount') || 'Total Amount'}:</span>
                  <span className='text-sm font-medium'>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(totalAmount)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm font-medium text-gray-500'>{t('admin.mileageExpenses.show.dateSubmitted') || 'Date Submitted'}:</span>
                  <span className='text-sm font-medium'>
                    {//@ts-ignore
                      expenseDeclaration?.created_at ? formatDate(expenseDeclaration.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='mt-6 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-lg font-medium'>
            <IconMap className='text-primary h-5 w-5' />
            {mileageExpenseItems.length > 0
              ? (t('admin.mileageExpenses.show.expensesCount') || `Mileage Expenses (${mileageExpenseItems.length})`)
              : t('admin.mileageExpenses.show.noExpenses') || 'No mileage expenses found'}
          </div>
          {mileageExpenseItems.length > 0 && (
            <div className='flex gap-4'>
              <div className='text-primary bg-primary/10 rounded-md px-3 py-1 text-sm font-semibold'>
                {t('admin.mileageExpenses.table.totalKm') || 'Total KM'}: {totalKm.toFixed(2)} km
              </div>
              <div className='text-primary bg-primary/10 rounded-md px-3 py-1 text-sm font-semibold'>
                {t('admin.mileageExpenses.show.totalAmount') || 'Total'}:{' '}
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(totalAmount)}
              </div>
            </div>
          )}
        </div>

        <div className='mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {mileageExpenseItems.length === 0 && (
            <div className='text-muted-foreground bg-muted/30 col-span-full rounded-lg border border-dashed p-8 text-center'>
              <p>{t('admin.mileageExpenses.show.noExpensesFound') || 'No mileage expenses found in this declaration.'}</p>
            </div>
          )}
          {mileageExpenseItems.map((expense) => (
            <MileageExpenseCard
              key={expense.id}
              expense={expense}
              readOnly={true}
            />
          ))}
        </div>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={isFilePreviewOpen} onOpenChange={setIsFilePreviewOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>
              <div className='flex items-center gap-2'>
                <IconFile size={18} />
                {filePreviewName || t('admin.mileageExpenses.show.documentPreview') || 'Document Preview'}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className='flex w-full justify-center'>
            {filePreviewUrl && (
              isFileImage(filePreviewType) ? (
                <img
                  src={filePreviewUrl}
                  alt={t('admin.mileageExpenses.show.documentPreview') || 'Document Preview'}
                  className='max-h-[70vh] object-contain'
                />
              ) : (
                <iframe
                  src={filePreviewUrl}
                  className='h-[70vh] w-full'
                  title={t('admin.mileageExpenses.show.documentPreview') || 'Document Preview'}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.mileageExpenses.show.rejectDialogTitle') || 'Reject Mileage Expense Declaration'}</DialogTitle>
            <DialogDescription>
              {t('admin.mileageExpenses.show.rejectDialogDescription') || 'Please provide a reason for rejecting this mileage expense declaration. The consultant will be notified and can make corrections.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(handleRejectExpense)}>
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.mileageExpenses.show.rejectionReason') || 'Rejection Reason'}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('admin.mileageExpenses.show.rejectionReasonPlaceholder') || 'Enter the reason for rejection...'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectDialogOpen(false)}
                  disabled={isProcessing}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isProcessing}
                >
                  {isProcessing ? t('admin.mileageExpenses.show.processing') || 'Processing...' : t('admin.mileageExpenses.show.confirmRejection') || 'Reject Declaration'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Rejection History Dialog */}
      <Dialog open={isRejectionHistoryOpen} onOpenChange={setIsRejectionHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconHistory size={18} />
              {t('admin.mileageExpenses.show.rejectionHistory') || 'Rejection History'}
            </DialogTitle>
            <DialogDescription>
              {t('admin.mileageExpenses.show.rejectionHistoryDescription') || 'Past rejections for this mileage expense declaration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {rejectionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{t('admin.mileageExpenses.show.noRejectionHistory') || 'No rejection history found.'}</p>
            ) : (
              rejectionHistory.map((rejection) => (
                <Card key={rejection.id} className="border-red-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500">
                      {formatDate(rejection.created_at)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm">{rejection.reason}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsRejectionHistoryOpen(false)}
            >
              {t('common.close') || 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}