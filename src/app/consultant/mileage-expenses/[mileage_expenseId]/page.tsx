'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
  IconFileText
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import MileageExpenseForm, {
  MileageExpenseFormValues
} from '@/features/consultant/mileage-expenses/components/mileage-expense-form';
import MileageExpenseCard, {
  MileageExpenseItem
} from '@/features/consultant/mileage-expenses/components/mileage-expense-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';

interface Media {
  id: number;
  file_name: string;
  original_url: string;
  mime_type: string;
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
  status: string;
  mileage_expense_details?: MileageExpenseItem[];
  rejections?: RejectionHistory[];
  signature_url?: string;
  media?: Media[];
}

interface RejectionHistory {
  id: string | number;
  reason: string;
  created_at: string;
}

export default function MileageExpenseEntryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { mileage_expenseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingDeclaration, setIsSubmittingDeclaration] = useState(false);
  const [mileageExpenseItems, setMileageExpenseItems] = useState<
    MileageExpenseItem[]
  >([]);
  const [expenseDeclaration, setExpenseDeclaration] =
    useState<MileageExpenseDeclaration | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [rejectionHistory, setRejectionHistory] = useState<RejectionHistory[]>(
    []
  );
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [filePreviewName, setFilePreviewName] = useState<string>('');
  const [filePreviewType, setFilePreviewType] = useState<string>('');

  const STATUS_CONFIG = {
    draft: {
      label: t('consultant.mileageExpenses.status.draft'),
      color: 'bg-slate-200 text-slate-800',
      icon: IconReceipt
    },
    to_sign: {
      label: t('consultant.mileageExpenses.status.toSign'),
      color: 'bg-blue-100 text-blue-800',
      icon: IconSignature
    },
    pending: {
      label: t('consultant.mileageExpenses.status.review'),
      color: 'bg-yellow-100 text-yellow-800',
      icon: IconClock
    },
    rejected: {
      label: t('consultant.mileageExpenses.status.rejected'),
      color: 'bg-red-100 text-red-800',
      icon: IconX
    },
    validated: {
      label: t('consultant.mileageExpenses.status.validated'),
      color: 'bg-green-100 text-green-800',
      icon: IconCircleCheck
    }
  };

  const getMonthName = (monthNumber: number | string): string => {
    const monthNum =
      typeof monthNumber === 'string' ? parseInt(monthNumber) : monthNumber;
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
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
          apiRoutes.consultant.mileageExpenses.detail(
            mileage_expenseId as string
          )
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
          toast.error(t('consultant.mileageExpenses.show.errorLoadingData'));
          router.push('/consultant/mileage-expenses/new');
        }
      } catch (error) {
        toast.error(t('consultant.mileageExpenses.show.errorLoadingData'));
        router.push('/consultant/mileage-expenses/new');
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
      toast.error(t('consultant.mileageExpenses.errors.load_missions_failed'));
    }
  };

  // Check if file is an image
  const isFileImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const getMonthBoundaries = () => {
    if (!expenseDeclaration)
      return { firstDay: new Date(), lastDay: new Date() };

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

  const handleMileageExpenseSubmit = async (data: MileageExpenseFormValues) => {
    if (!expenseDeclaration) return;
    setIsSubmitting(true);
    try {
      const formattedDate = format(data.date, 'yyyy-MM-dd');
      let response;
      let updatedExpense: MileageExpenseItem;

      if (editingExpenseId !== null) {
        response = await apiClient.put(
          apiRoutes.consultant.mileageExpenseDetails.update(editingExpenseId),
          {
            mileage_expense_id: mileage_expenseId,
            from_adresse: data.from_adresse,
            to_adresse: data.to_adresse,
            description: data.description,
            day: formattedDate,
            month: expenseDeclaration.month,
            year: expenseDeclaration.year,
            total_km: data.distance,
            total_price: data.total_price
          }
        );

        if (response.data?.success) {
          const expenseDetail = response.data.data;
          updatedExpense = {
            id: expenseDetail.id,
            mileage_expense_id: parseInt(mileage_expenseId as string),
            from_adresse: expenseDetail.from_adresse,
            to_adresse: expenseDetail.to_adresse,
            description: expenseDetail.description,
            day: expenseDetail.day,
            total_km: expenseDetail.total_km,
            total_price: expenseDetail.total_price
          };

          setMileageExpenseItems((prevItems) =>
            prevItems.map((item) =>
              item.id === editingExpenseId ? updatedExpense : item
            )
          );
          toast.success(t('consultant.mileageExpenses.form.updateExpense'));
        } else {
          toast.error(
            response.data?.message || t('consultant.mileageExpenses.create.error')
          );
        }
      } else {
        response = await apiClient.post(
          apiRoutes.consultant.mileageExpenseDetails.create,
          {
            mileage_expense_id: mileage_expenseId,
            from_adresse: data.from_adresse,
            to_adresse: data.to_adresse,
            description: data.description,
            day: formattedDate,
            month: expenseDeclaration.month,
            year: expenseDeclaration.year,
            total_km: data.distance,
            total_price: data.total_price
          }
        );

        if (response.data?.success) {
          const expenseDetail = response.data.data;
          updatedExpense = {
            id: expenseDetail.id,
            mileage_expense_id: parseInt(mileage_expenseId as string),
            from_adresse: expenseDetail.from_adresse,
            to_adresse: expenseDetail.to_adresse,
            description: expenseDetail.description,
            day: expenseDetail.day,
            total_km: expenseDetail.total_km,
            total_price: expenseDetail.total_price
          };

          setMileageExpenseItems((prevItems) => [...prevItems, updatedExpense]);
          toast.success(t('consultant.mileageExpenses.create.success'));
        } else {
          toast.error(
            response.data?.message || t('consultant.mileageExpenses.create.error')
          );
        }
      }
      setEditingExpenseId(null);
    } catch (error) {
      toast.error(
        editingExpenseId !== null
          ? t('consultant.mileageExpenses.create.error')
          : t('consultant.mileageExpenses.create.error_generic')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number, showNotification = true) => {
    if (!id) {
      if (showNotification)
        toast.error(t('consultant.mileageExpenses.errors.delete_failed'));
      return;
    }

    try {
      const response = await apiClient.delete(
        apiRoutes.consultant.mileageExpenseDetails.delete(id)
      );

      if (response.data?.success) {
        setMileageExpenseItems(
          mileageExpenseItems.filter((item) => item.id !== id)
        );
        if (showNotification)
          toast.success(t('consultant.mileageExpenses.delete_success'));
        if (editingExpenseId === id) setEditingExpenseId(null);
      } else {
        if (showNotification)
          toast.error(
            response.data?.message || t('consultant.mileageExpenses.errors.delete_failed')
          );
      }
    } catch (error) {
      if (showNotification)
        toast.error(t('consultant.mileageExpenses.errors.delete_failed'));
    }
  };

  const handleDuplicateReturn = async (id: number) => {
    if (!id) {
      toast.error(t('consultant.mileageExpenses.errors.duplicate_failed'));
      return;
    }

    try {
      const response = await apiClient.post(
        apiRoutes.consultant.mileageExpenses.duplicateReturn(id)
      );

      if (response.data?.success) {
        const newExpense = response.data.data;
        const duplicatedExpense: MileageExpenseItem = {
          id: newExpense.id,
          mileage_expense_id: newExpense.mileage_expense_id,
          from_adresse: newExpense.from_adresse,
          to_adresse: newExpense.to_adresse,
          description: newExpense.description,
          day: newExpense.day,
          total_km: newExpense.total_km,
          total_price: newExpense.total_price
        };

        setMileageExpenseItems((prevItems) => [...prevItems, duplicatedExpense]);
        toast.success(t('consultant.mileageExpenses.duplicateReturn.success'));
      } else {
        toast.error(
          response.data?.message || t('consultant.mileageExpenses.errors.duplicate_failed')
        );
      }
    } catch (error) {
      toast.error(t('consultant.mileageExpenses.errors.duplicate_failed'));
    }
  };

  const handleEditExpense = (id: number) => {
    if (expenseDeclaration?.status !== 'draft') {
      toast.error(t('consultant.mileageExpenses.create.error'));
      return;
    }

    const expenseToEdit = mileageExpenseItems.find((item) => item.id === id);
    if (!expenseToEdit) return;

    setEditingExpenseId(id);
    toast.info(t('consultant.mileageExpenses.show.editingExpense'));
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
  };

  const handleDeclareExpenses = async () => {
    if (mileageExpenseItems.length === 0) {
      toast.error(t('consultant.mileageExpenses.declare.error'));
      return;
    }

    setIsSubmittingDeclaration(true);

    try {
      const response = await apiClient.post(
        apiRoutes.consultant.mileageExpenses.declare(
          mileage_expenseId as string
        )
      );

      if (response.data?.success) {
        setExpenseDeclaration((prev) =>
          prev ? { ...prev, status: 'to_sign' } : null
        );
        if (response.data.data?.signature_url) {
          window.location.href = response.data.data.signature_url;
        } else {
          toast.success(t('consultant.mileageExpenses.declare.success'));
        }
      } else {
        toast.error(
          response.data?.message || t('consultant.mileageExpenses.declare.error')
        );
      }
    } catch (error) {
      toast.error(t('consultant.mileageExpenses.declare.error'));
    } finally {
      setIsSubmittingDeclaration(false);
    }
  };

  const handleSignDocument = () => {
    if (expenseDeclaration?.signature_url) {
      window.location.href = expenseDeclaration.signature_url;
    } else {
      toast.error(t('consultant.mileageExpenses.declare.error'));
    }
  };

  const getFormDefaultValues = () => {
    if (editingExpenseId === null) {
      return {
        from_adresse: '',
        to_adresse: '',
        description: '',
        date: expenseDeclaration
          ? new Date(
            parseInt(String(expenseDeclaration.year)),
            parseInt(String(expenseDeclaration.month)) - 1,
            15
          )
          : new Date()
      };
    }

    const expenseToEdit = mileageExpenseItems.find(
      (item) => item.id === editingExpenseId
    );
    if (!expenseToEdit) return undefined;

    let expenseDate: Date;
    if (
      typeof expenseToEdit.day === 'string' &&
      expenseToEdit.day.includes('-')
    ) {
      expenseDate = new Date(expenseToEdit.day);
    } else {
      expenseDate = new Date();
    }

    return {
      from_adresse: expenseToEdit.from_adresse || '',
      to_adresse: expenseToEdit.to_adresse || '',
      description: expenseToEdit.description || '',
      date: expenseDate
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
      <Badge
        className={`${config.color} flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase`}
      >
        <IconComponent size={14} />
        {config.label}
      </Badge>
    );
  };

  const renderStatusMessage = () => {
    if (!expenseDeclaration?.status || expenseDeclaration.status === 'draft')
      return null;

    const messages = {
      to_sign: {
        title: t('consultant.mileageExpenses.status.toSign'),
        description: t('consultant.mileageExpenses.statusMessages.to_sign')
      },
      pending: {
        title: t('consultant.mileageExpenses.status.review'),
        description: t('consultant.mileageExpenses.statusMessages.pending'),
        variant: 'warning'
      },
      rejected: {
        title: t('consultant.mileageExpenses.status.rejected'),
        description: t('consultant.mileageExpenses.statusMessages.rejected'),
        variant: 'destructive'
      },
      validated: {
        title: t('consultant.mileageExpenses.status.validated'),
        description: t('consultant.mileageExpenses.statusMessages.validated'),
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
                : 'border-yellow-200 bg-yellow-50'
        } mb-4`}
      >
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg'>{message.title}</CardTitle>
          <CardDescription>{message.description}</CardDescription>
          {hasSignedDocument() && ['pending', 'validated'].includes(status) && (
            <div className='mt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleViewSignedDocument}
                className='flex items-center gap-1'
              >
                <IconFileText size={16} />
                {t('consultant.mileageExpenses.show.documentPreview')}
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>
    );
  };

  const isDraft = expenseDeclaration?.status === 'draft';
  const isToSign = expenseDeclaration?.status === 'to_sign';

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
      const response = await apiClient.post(
        apiRoutes.consultant.mileageExpenses.coriger(
          mileage_expenseId as string
        )
      );

      if (response.data?.success) {
        toast.success(t('consultant.mileageExpenses.correct.success'));
        setExpenseDeclaration((prev) =>
          prev ? { ...prev, status: 'draft' } : null
        );
        setEditingExpenseId(null);
      } else {
        toast.error(
          response.data?.message || t('consultant.mileageExpenses.correct.error')
        );
      }
    } catch (error) {
      toast.error(t('consultant.mileageExpenses.correct.error'));
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
                title={t('consultant.mileageExpenses.show.mileageExpense')}
                description={
                  expenseDeclaration
                    ? `${expenseDeclaration.month_name} ${expenseDeclaration.year} - ${expenseDeclaration.mission.title}`
                    : t('consultant.mileageExpenses.show.loading')
                }
              />
            </div>
          </div>
          <div className='flex gap-2'>
            {renderStatusBadge()}
            <Button
              variant='outline'
              onClick={() => router.push('/consultant/mileage-expenses')}
              className='h-9'
              size='sm'
            >
              {t('consultant.mileageExpenses.show.back')}
            </Button>
            {isDraft && (
              <Button
                onClick={handleDeclareExpenses}
                disabled={
                  mileageExpenseItems.length === 0 || isSubmittingDeclaration
                }
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
                    <span className='ml-2'>{t('consultant.mileageExpenses.declare.submitting')}</span>
                  </>
                ) : (
                  <>
                    <IconCheck className='mr-2 h-4 w-4' /> {t('consultant.mileageExpenses.show.submitAll')}
                  </>
                )}
              </Button>
            )}
            {isToSign && expenseDeclaration?.signature_url && (
              <Button onClick={handleSignDocument} className='h-9'>
                <IconSignature className='mr-2 h-4 w-4' /> {t('consultant.mileageExpenses.show.signDocument')}
              </Button>
            )}
            {expenseDeclaration?.status === 'rejected' && (
              <Button onClick={handleCorrectDeclaration} className='h-9' variant='outline'>
                <IconReceipt className='mr-2 h-4 w-4' /> {t('consultant.mileageExpenses.show.correctDeclaration')}
              </Button>
            )}
          </div>
        </div>
        <Separator />

        {renderStatusMessage()}

        {isDraft && (
          <Card className='border-primary/20 shadow-sm p-2'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <IconMapPin className='text-primary h-5 w-5' />
                {editingExpenseId !== null
                  ? t('consultant.mileageExpenses.show.editExpense')
                  : t('consultant.mileageExpenses.show.addNewExpense')}
              </CardTitle>
              <CardDescription>
                {editingExpenseId !== null
                  ? t('consultant.mileageExpenses.show.editExpenseDescription')
                  : t('consultant.mileageExpenses.show.addExpenseDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <MileageExpenseForm
                onSubmit={handleMileageExpenseSubmit}
                onCancelEdit={handleCancelEdit}
                isSubmitting={isSubmitting}
                isEditing={editingExpenseId !== null}
                defaultValues={getFormDefaultValues()}
                dateFilter={isDateInSelectedMonth}
                mission_id={expenseDeclaration?.mission?.id}
              />
            </CardContent>
          </Card>
        )}

        <div className='mt-6 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-lg font-medium'>
            <IconMap className='text-primary h-5 w-5' />
            {mileageExpenseItems.length > 0
              ? `${t('consultant.mileageExpenses.show.mileageExpense')} ${isDraft ? t('consultant.mileageExpenses.show.addedExpenses') : ''} (${mileageExpenseItems.length})`
              : isDraft
                ? t('consultant.mileageExpenses.show.noExpensesYet')
                : t('consultant.mileageExpenses.show.noMileageExpenseFound')}
          </div>
          {mileageExpenseItems.length > 0 && (
            <div className='flex gap-4'>
              <div className='text-primary bg-primary/10 rounded-md px-3 py-1 text-sm font-semibold'>
                {t('consultant.mileageExpenses.show.totalKm')}: {totalKm.toFixed(2)} km
              </div>
              <div className='text-primary bg-primary/10 rounded-md px-3 py-1 text-sm font-semibold'>
                {t('consultant.mileageExpenses.show.amountTTC')}:{' '}
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(totalAmount)}

              </div>
            </div>
          )}
        </div>

        {rejectionHistory.length > 0 &&
          expenseDeclaration?.status === 'rejected' && (
            <Card className='border-red-200 bg-red-50 shadow-sm'>
              <CardHeader className=''>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <IconX className='h-5 w-5 text-red-500' />
                  {t('consultant.mileageExpenses.show.rejectionReasons')}
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-0 p-0 m-0'>
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
                      <div className=' text-sm text-gray-700'>
                        {rejection.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        <div className='mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {mileageExpenseItems.length === 0 && (
            <div className='text-muted-foreground bg-muted/30 col-span-full rounded-lg border border-dashed p-8 text-center'>
              {isDraft ? (
                <p>{t('consultant.mileageExpenses.show.noExpensesYet')}</p>
              ) : (
                <p>{t('consultant.mileageExpenses.show.noMileageExpenseFound')}</p>
              )}
            </div>
          )}

          {mileageExpenseItems.map((expense) => (
            <MileageExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={isDraft ? handleEditExpense : undefined}
              onDelete={isDraft ? handleDeleteExpense : undefined}
              onDuplicateReturn={isDraft ? handleDuplicateReturn : undefined}
              isBeingEdited={editingExpenseId === expense.id}
              readOnly={!isDraft}
            />
          ))}
        </div>
      </div>

      {/* File Preview Dialog - Improved to handle different file types */}
      <Dialog open={isFilePreviewOpen} onOpenChange={setIsFilePreviewOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>
              <div className='flex items-center gap-2'>
                <IconFile size={18} />
                {filePreviewName || t('consultant.mileageExpenses.show.documentPreview')}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className='flex w-full justify-center'>
            {filePreviewUrl && (
              isFileImage(filePreviewType) ? (
                <img
                  src={filePreviewUrl}
                  alt={t('consultant.mileageExpenses.show.documentPreview')}
                  className='max-h-[70vh] object-contain'
                />
              ) : (
                <iframe
                  src={filePreviewUrl}
                  className='h-[70vh] w-full'
                  title={t('consultant.mileageExpenses.show.documentPreview')}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}