'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { IconEdit } from '@tabler/icons-react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCheck,
  IconReceipt,
  IconClock,
  IconX,
  IconCash,
  IconFileText,
  IconCalendar,
  IconSend,
  IconCircleCheck,
  IconBriefcase,
  IconUser,
  IconBuilding
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import InvoiceLineForm, {
  InvoiceLineFormValues
} from '@/features/invoices/components/invoice-line-form';
import InvoiceLineCard, {
  InvoiceLineItem
} from '@/features/invoices/components/invoice-line-card';
import InvoiceLinesHeader from '@/features/invoices/components/invoice-lines-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PaymentAddModal } from '@/features/invoices/components/PaymentAddModal';
import { PaymentDetailsModal } from '@/features/invoices/components/PaymentDetailsModal';
import { useLanguage } from '@/context/LanguageContext';

interface Invoice {
  id: number;
  reference: string;
  client_id: number;
  objet: string;
  date: string;
  date_echenace: string;
  total_ht: string;
  total_ttc: string;
  status: 'draft' | 'validated' | 'paid';
  status_paiement: string;
  nombre_denvoie: number;
  created_at: string;
  updated_at: string;
  media: {
    original_url: string;
  }[];
  deleted_at?: string | null;
  client: {
    id: number;
    name: string;
  };
  mission?: {
    id: number;
    title: string;
  };
  consultant?: {
    id: number;
    nom: string;
    prenom: string;
    full_name: string;
  };
  paiements?: {
    bank: string;
    pay_date: string;
    mode: string;
    amount_ht: string;
    amount_ttc: string;
  }[];
  lignes?: InvoiceLineItem[];
}

export default function InvoiceEntryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { invoiceId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineItem[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] =
    useState(false);
  const [isDevalidateModalOpen, setIsDevalidateModalOpen] = useState(false);
  const [isChangeReferenceModalOpen, setIsChangeReferenceModalOpen] =
    useState(false);
  const [newReference, setNewReference] = useState<string>('');

  const STATUS_CONFIG = {
    draft: {
      label: t('admin.invoices.status.draft') || 'Draft',
      color: 'bg-slate-200 text-slate-800',
      icon: IconReceipt
    },
    validated: {
      label: t('admin.invoices.status.validated') || 'Validated',
      color: 'bg-green-100 text-green-800',
      icon: IconCircleCheck
    },
    paid: {
      label: t('admin.invoices.status.paid') || 'Paid',
      color: 'bg-blue-100 text-blue-800',
      icon: IconCash
    }
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(
          apiRoutes.admin.invoices.detail(invoiceId as string)
        );

        if (response.data?.success) {
          const invoiceData = response.data.data;
          setInvoice(invoiceData);
          if (invoiceData.lignes && Array.isArray(invoiceData.lignes)) {
            setInvoiceLines(invoiceData.lignes);
          } else {
            setInvoiceLines([]);
          }
        } else {
          toast.error(
            t('admin.invoices.detail.errorLoading') ||
              'Failed to load invoice details'
          );
          router.push('/admin/invoices');
        }
      } catch (error) {
        toast.error(
          t('admin.invoices.detail.errorLoading') ||
            'Failed to load invoice details'
        );
        router.push('/admin/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [invoiceId, router, t]);

  const handleCancelEdit = () => {
    setEditingLineId(null);
  };
// Update the date form schema with validation
  const dateFormSchema = z.object({
    date: z.date({
      required_error: t('admin.invoices.messages.dateRequired') || 'Invoice date is required',
    }),
    date_echeance: z.date({
      required_error: t('admin.invoices.messages.dueDateRequired') || 'Due date is required',
    })
  }).refine(data => {
    // Ensure due date is not before invoice date
    if (data.date && data.date_echeance) {
      return data.date_echeance >= data.date;
    }
    return true;
  }, {
    message: t('admin.invoices.messages.dueDateMustBeAfterInvoiceDate') || 'Due date must be on or after the invoice date',
    path: ['date_echeance']
  });
  type DateFormValues = z.infer<typeof dateFormSchema>;

  const dateForm = useForm<DateFormValues>({
    resolver: zodResolver(dateFormSchema),
    defaultValues: {
      date: invoice?.date ? new Date(invoice.date) : undefined,
      date_echeance: invoice?.date_echenace ? new Date(invoice.date_echenace) : undefined
    }
  });
// Update your handleDateUpdate function to reset the form after submission
  const handleDateUpdate = async (values: DateFormValues) => {
    if (!invoiceId) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.put(
        apiRoutes.admin.invoices.updateDate(invoiceId as string),
        {
          date: values.date,
          date_echeance: values.date_echeance
        }
      );

      if (response.data?.success) {
        toast.success(t('admin.invoices.dateUpdateSuccess') || 'Invoice dates updated successfully');
        setInvoice((prev) => ({
          ...prev!,
          date: values.date ? values.date.toISOString() : prev!.date,
          date_echenace: values.date_echeance ? values.date_echeance.toISOString() : prev!.date_echenace
        }));
        setIsDateModalOpen(false);
        // Reset form values
        dateForm.reset({
          date: values.date,
          date_echeance: values.date_echeance
        });
      } else {
        throw new Error(response.data?.message || t('admin.invoices.dateUpdateError') || 'Failed to update invoice dates');
      }
    } catch (error: any) {
      toast.error(error.message || t('admin.invoices.dateUpdateError') || 'Failed to update invoice dates');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInvoiceLineSubmit = async (data: InvoiceLineFormValues) => {
    if (!invoice) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let response;
      let updatedLine: InvoiceLineItem;

      if (editingLineId !== null) {
        response = await apiClient.put(
          apiRoutes.admin.invoiceLines.update(editingLineId),
          {
            invoice_id: invoiceId,
            designation: data.designation,
            nombre: data.nombre,
            amount_ht: data.amount_ht,
            tva: data.tva
          }
        );

        updatedLine = response.data.data;
      } else {
        response = await apiClient.post(apiRoutes.admin.invoiceLines.create, {
          invoice_id: invoiceId,
          designation: data.designation,
          nombre: data.nombre,
          amount_ht: data.amount_ht,
          tva: data.tva
        });

        updatedLine = response.data.data;
      }

      if (response.data?.success) {
        setInvoiceLines((prevLines) =>
          editingLineId !== null
            ? prevLines.map((line) =>
                line.id === editingLineId ? updatedLine : line
              )
            : [...prevLines, updatedLine]
        );
        if (response.data.data.invoice) {
          setInvoice((prev) => ({
            ...prev!,
            total_ht: response.data.data.invoice.total_ht,
            total_ttc: response.data.data.invoice.total_ttc
          }));
        }
        toast.success(
          editingLineId !== null
            ? t('admin.invoices.lines.updateSuccess') ||
                'Invoice line updated successfully'
            : t('admin.invoices.lines.addSuccess') ||
                'Invoice line added successfully'
        );
        setEditingLineId(null);
      } else {
        throw new Error(
          response.data?.message ||
            t('admin.invoices.lines.saveError') ||
            'Failed to save invoice line'
        );
      }
    } catch (error: any) {
      setError(
        error.message ||
          t('admin.invoices.lines.errorOccurred') ||
          'An error occurred'
      );
      toast.error(
        editingLineId !== null
          ? t('admin.invoices.lines.updateError') ||
              'Failed to update invoice line'
          : t('admin.invoices.lines.addError') || 'Failed to add invoice line'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLine = async (id: number) => {
    if (!id) {
      toast.error(
        t('admin.invoices.lines.invalidIdError') ||
          'Cannot delete this invoice line: Invalid ID'
      );
      return;
    }
    try {
      const response = await apiClient.delete(
        apiRoutes.admin.invoiceLines.delete(id)
      );

      if (response.data?.success) {
        setInvoiceLines((prev) => prev.filter((line) => line.id !== id));

        if (response.data.invoice) {
          setInvoice((prev) => ({
            ...prev!,
            total_ht: response.data.invoice.total_ht,
            total_ttc: response.data.invoice.total_ttc
          }));
        }

        toast.success(
          t('admin.invoices.lines.deleteSuccess') ||
            'Invoice line deleted successfully'
        );
        if (editingLineId === id) setEditingLineId(null);
      } else {
        throw new Error(
          response.data?.message ||
            t('admin.invoices.lines.deleteError') ||
            'Failed to delete invoice line'
        );
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          t('admin.invoices.lines.deleteError') ||
          'Failed to delete invoice line'
      );
    }
  };

  const handleEditLine = (id: number) => {
    if (invoice?.status !== 'draft') {
      toast.error(
        t('admin.invoices.lines.cantEditStatus') ||
          "You can't edit invoice lines in the current status"
      );
      return;
    }
    const lineToEdit = invoiceLines.find((line) => line.id === id);
    if (!lineToEdit) return;
    setEditingLineId(id);
  };

  const handleValidateInvoice = async () => {
    if (!invoiceId) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.admin.invoices.validate(invoiceId as string)
      );

      if (response.data?.success) {
        toast.success(
          t('admin.invoices.validateSuccess') ||
            'Invoice validated successfully'
        );
        setInvoice((prev) => ({
          ...prev!,
          ...response.data.data,
          media: response.data.data.media || []
        }));
      } else {
        throw new Error(
          response.data?.message ||
            t('admin.invoices.validateError') ||
            'Failed to validate invoice'
        );
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          t('admin.invoices.validateError') ||
          'Failed to validate invoice'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoiceId) return;

    try {
      setIsSubmitting(true);
      const response = await apiClient.post(
        apiRoutes.admin.invoices.send(invoiceId as string)
      );

      if (response.data?.success) {
        toast.success(
          t('admin.invoices.sendSuccess') || 'Invoice sent successfully'
        );
        setInvoice((prev) => ({
          ...prev!,
          nombre_denvoie: response.data.data.nombre_denvoie
        }));
      } else {
        throw new Error(
          response.data?.message ||
            t('admin.invoices.sendError') ||
            'Failed to send invoice'
        );
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          t('admin.invoices.sendError') ||
          'Failed to send invoice'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const justificatif = invoice?.media?.find(
    //@ts-ignore
    (m) => m.collection_name === "invoice_justificatifs"
  );
  const InvoiceDocument= invoice?.media?.find(
    //@ts-ignore
    (m) => m.collection_name === "invoice_document"
  );
  const handleViewDocument = () => {
    if (InvoiceDocument?.original_url) {
      window.open(InvoiceDocument?.original_url, '_blank');
    } else {
      toast.error(
        t('admin.invoices.noFileToDownload') || 'Document not available'
      );
    }
  };
  const handleViewDocumentAttached = () => {

    if (justificatif?.original_url) {
      window.open(justificatif.original_url, '_blank');
    } else {
      toast.error(
        t('admin.invoices.noFileToDownload') || 'Document not available'
      );
    }
  };

  const renderStatusBadge = () => {
    if (!invoice?.status) return null;

    const status = invoice.status.toLowerCase();
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

  const getFormDefaultValues = () => {
    if (editingLineId === null) {
      return {
        designation: '',
        nombre: 1,
        amount_ht: 0,
        tva: 20
      };
    }

    const lineToEdit = invoiceLines.find((line) => line.id === editingLineId);
    return lineToEdit
      ? {
          designation: lineToEdit.designation || '',
          nombre: lineToEdit.nombre || 1,
          amount_ht: lineToEdit.amount_ht || 0,
          tva: lineToEdit.tva || 20
        }
      : undefined;
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

  if (!invoice) {
    return (
      <PageContainer>
        <div className='flex h-64 items-center justify-center'>
          <p className='text-gray-500'>
            {t('admin.invoices.detail.notFound') || 'Invoice not found'}
          </p>
        </div>
      </PageContainer>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isValidated = invoice.status === 'validated';
  const isPaid = invoice.status === 'paid';
  const totalHT = parseFloat(invoice.total_ht || '0');
  const totalTTC = parseFloat(invoice.total_ttc || '0');

  return (
    <PageContainer>
      <div className='w-full space-y-3'>
        <div className='rounded-lg bg-gray-50 p-4'>
          <div className='mb-3 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <Heading
                  title={
                    invoice.reference ||
                    t('admin.invoices.detail.title') ||
                    'Invoice Details'
                  }
                  description={
                    invoice.objet ||
                    t('admin.invoices.detail.noDescription') ||
                    'No description provided'
                  }
                />
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              {renderStatusBadge()}
              <Badge
                className={`${
                  invoice.status_paiement === 'paid'
                    ? 'cursor-pointer border border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'border border-yellow-300 bg-yellow-100 text-yellow-800'
                } flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold`}
                onClick={() =>
                  invoice.status_paiement === 'paid' &&
                  setIsPaymentDetailsModalOpen(true)
                }
              >
                {invoice.status_paiement === 'paid' ? (
                  <>
                    <IconCheck size={16} />
                    {t('admin.invoices.paymentStatus.paid') || 'Paid'}
                  </>
                ) : (
                  <>
                    <IconX size={16} />
                    {t('admin.invoices.paymentStatus.unpaid') || 'Unpaid'}
                  </>
                )}
              </Badge>
              {isValidated && (
                <Button
                  variant='default'
                  className='bg-red-400 text-white hover:bg-red-600'
                  onClick={handleViewDocument}
                >
                  <IconFileText className='h-4 w-4' />
                  {t('admin.invoices.view') || 'View'}
                </Button>
              )}
              <Button
                variant='outline'
                onClick={() => router.push('/admin/invoices')}
                className='h-9'
                size='sm'
              >
                {t('admin.invoices.detail.backToInvoices') ||
                  'Back to Invoices'}
              </Button>
              {isDraft && (
                <Button
                  onClick={handleValidateInvoice}
                  className='h-9'
                  size='sm'
                  disabled={isSubmitting || invoiceLines.length === 0}
                >
                  <IconCheck className='mr-2 h-4 w-4' />{' '}
                  {t('admin.invoices.detail.validateInvoice') ||
                    'Validate Invoice'}
                </Button>
              )}
              {isValidated && (
                <Button
                  onClick={handleSendInvoice}
                  className='h-9'
                  size='sm'
                  disabled={isSubmitting}
                >
                  <IconSend className='mr-2 h-4 w-4' />{' '}
                  {t('admin.invoices.detail.sendToClient') || 'Send to Client'}
                </Button>
              )}
              {isValidated && invoice.status_paiement !== 'paid' && (
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className='h-9 border border-indigo-200 bg-indigo-50 px-4 text-indigo-600 hover:bg-indigo-100'
                  size='sm'
                >
                  <IconCash className='h-4 w-4' />
                  {t('admin.invoices.detail.pay') || 'Pay'}
                </Button>
              )}
              {/* Bouton pour dévalider la facture */}
              {isValidated && invoice.status_paiement !== 'paid' && (
                <Button
                  onClick={() => setIsDevalidateModalOpen(true)}
                  variant='outline'
                  className='h-9 border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100'
                  size='sm'
                >
                  <IconX className='h-4 w-4' />
                  {t('admin.invoices.devalidateInvoice') || 'Devalidate'}
                </Button>
              )}
              {/* Bouton pour changer la référence */}
              {isValidated && (
                <Button
                  onClick={() => {
                    setNewReference(invoice.reference);
                    setIsChangeReferenceModalOpen(true);
                  }}
                  variant='outline'
                  className='h-9'
                  size='sm'
                >
                  <IconEdit className='h-4 w-4' />
                  {t('admin.invoices.changeReference') || 'Change Reference'}
                </Button>
              )}
              {justificatif && (
                <Button
                  variant='outline'
                  className='border-green-400 bg-green-50 text-green-700 hover:bg-green-100'
                  onClick={handleViewDocumentAttached}
                >
                  <IconCheck className='h-4 w-4' />
                  {t('admin.invoices.form.viewJustificatif') || 'View'}
                </Button>
              )}
            </div>
          </div>

          <div className='flex flex-wrap gap-6 text-sm'>
            {/* Client information */}
            {invoice.client && (
              <div className='flex items-center gap-2'>
                <IconBuilding className='h-4 w-4 text-slate-400' />
                <div>
                  <span className='text-muted-foreground mr-1'>
                    {t('admin.invoices.table.client') || 'Client'}:
                  </span>
                  <span className='font-medium'>{invoice.client.name}</span>
                </div>
              </div>
            )}

            {/* Consultant information */}
            {invoice.consultant && (
              <div className='flex items-center gap-2'>
                <IconUser className='h-4 w-4 text-slate-400' />
                <div>
                  <span className='text-muted-foreground mr-1'>
                    {t('admin.invoices.detail.consultant') || 'Consultant'}:
                  </span>
                  <span className='font-medium'>
                    {invoice.consultant.full_name ||
                      `${invoice.consultant.prenom} ${invoice.consultant.nom}`}
                  </span>
                </div>
              </div>
            )}

            {/* Mission information */}
            {invoice.mission && (
              <div className='flex items-center gap-2'>
                <IconBriefcase className='h-4 w-4 text-slate-400' />
                <div>
                  <span className='text-muted-foreground mr-1'>
                    {t('admin.invoices.detail.mission') || 'Mission'}:
                  </span>
                  <span className='font-medium'>{invoice.mission.title}</span>
                </div>
              </div>
            )}

            {/* Invoice date */}
            <div
              className={`flex items-center gap-2 ${isDraft ? 'rounded-md border border-dashed border-gray-300 bg-gray-50 p-2' : ''}`}
            >
              <IconCalendar className='h-4 w-4 text-slate-400' />
              <div>
                <span className='text-muted-foreground mr-1'>
                  {t('admin.invoices.table.date') || 'Invoice Date'}:
                </span>
                <span className='font-medium'>
                  {invoice.date ? formatDate(invoice.date) : '-'}
                </span>
              </div>
              {isDraft && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-1 h-6 w-6 rounded-full p-0 transition-colors hover:bg-gray-200'
                  onClick={() => setIsDateModalOpen(true)}
                >
                  <IconEdit className='h-3.5 w-3.5 text-slate-500 ' />
                </Button>
              )}
            </div>

            {/* Due date */}
            <div
              className={`flex items-center gap-2 ${isDraft ? 'rounded-md border border-dashed border-gray-300 bg-gray-50 p-2' : ''}`}
            >
              <IconClock className='h-4 w-4 text-slate-400' />
              <div>
                <span className='text-muted-foreground mr-1'>
                  {t('admin.invoices.table.dueDate') || 'Due Date'}:
                </span>
                <span className='font-medium'>
                  {invoice.date_echenace
                    ? formatDate(invoice.date_echenace)
                    : '-'}
                </span>
              </div>
              {isDraft && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-1 h-6 w-6 rounded-full p-0 transition-colors hover:bg-gray-200'
                  onClick={() => setIsDateModalOpen(true)}
                >
                  <IconEdit className='h-3.5 w-3.5 text-slate-500' />
                </Button>
              )}
            </div>

            {/* Times sent */}
            {invoice.nombre_denvoie !== undefined && (
              <div className='flex items-center gap-2'>
                <IconSend className='h-4 w-4 text-slate-400' />
                <div>
                  <span className='text-muted-foreground mr-1'>
                    {t('admin.invoices.detail.timesSent') || 'Times Sent'}:
                  </span>
                  <span className='font-medium'>{invoice.nombre_denvoie}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className='my-1' />

        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isDraft && (
          <Card className='border-primary/20 shadow-sm'>
            <CardContent className='pt-0'>
              <InvoiceLineForm
                onSubmit={handleInvoiceLineSubmit}
                onCancelEdit={handleCancelEdit}
                isSubmitting={isSubmitting}
                isEditing={editingLineId !== null}
                defaultValues={getFormDefaultValues()}
              />
            </CardContent>
          </Card>
        )}

        <div className='mt-4'>
          <div className='mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center'>
            <div className='flex items-center gap-2 text-lg font-medium'>
              <IconFileText className='text-primary h-5 w-5' />
              {invoiceLines.length > 0
                ? t('admin.invoices.detail.invoiceLinesCount') ||
                  `Invoice Lines ${isDraft ? 'Added' : ''} (${invoiceLines.length})`
                : isDraft
                  ? t('admin.invoices.detail.noInvoiceLinesAddedYet') ||
                    `No invoice lines added yet`
                  : t('admin.invoices.detail.noInvoiceLinesFound') ||
                    `No invoice lines found`}
            </div>
            {invoiceLines.length > 0 && (
              <div className='flex gap-3'>
                <div className='rounded-md bg-gray-100 px-3 py-1 text-sm'>
                  <span className='text-gray-500'>
                    {t('admin.invoices.table.totalHt') || 'Total HT'}:
                  </span>{' '}
                  <span className='font-semibold'>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(totalHT)}
                  </span>
                </div>
                <div className='rounded-md bg-blue-50 px-3 py-1 text-sm'>
                  <span className='text-gray-500'>
                    {t('admin.invoices.table.totalTtc') || 'Total TTC'}:
                  </span>{' '}
                  <span className='font-semibold text-blue-600'>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(totalTTC)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {invoiceLines.length > 0 ? (
            <div className='overflow-hidden rounded-md border shadow-sm'>
              <InvoiceLinesHeader />
              <div>
                {invoiceLines.map((line, index) => (
                  <InvoiceLineCard
                    key={line.id}
                    invoiceLine={line}
                    onEdit={isDraft ? handleEditLine : undefined}
                    onDelete={isDraft ? handleDeleteLine : undefined}
                    isBeingEdited={editingLineId === line.id}
                    readOnly={!isDraft}
                    isEven={index % 2 === 1}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground rounded-lg border border-dashed bg-gray-50 p-6 text-center'>
              {isDraft ? (
                <p>
                  {t('admin.invoices.detail.noLinesAddedYetUseForm') ||
                    'No invoice lines added yet. Use the form above to add lines to your invoice.'}
                </p>
              ) : (
                <p>
                  {t('admin.invoices.detail.noInvoiceLinesFound') ||
                    'No invoice lines found in this invoice.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment Modals */}
        <PaymentAddModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          invoiceId={invoiceId as string}
          totalHT={invoice.total_ht}
          totalTTC={invoice.total_ttc}
          onPaymentAdded={() => {
            apiClient
              .get(apiRoutes.admin.invoices.detail(invoiceId as string))
              .then((response) => {
                if (response.data?.success) {
                  setInvoice(response.data.data);
                }
              });
          }}
        />

        <PaymentDetailsModal
          open={isPaymentDetailsModalOpen}
          onOpenChange={setIsPaymentDetailsModalOpen}
          payments={invoice.paiements || []}
          invoiceReference={invoice.reference}
          onViewInvoice={handleViewDocument}
        />
      </div>
      {/* Date Edit Modal */}
      <Dialog
        open={isDateModalOpen}
        onOpenChange={(open) => {
          setIsDateModalOpen(open);
          if (!open) {
            dateForm.reset({
              date: invoice?.date ? new Date(invoice.date) : undefined,
              date_echeance: invoice?.date_echenace ? new Date(invoice.date_echenace) : undefined
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.invoices.editDates') || 'Edit Invoice Dates'}</DialogTitle>
          </DialogHeader>

          <Form {...dateForm}>
            <form onSubmit={dateForm.handleSubmit(handleDateUpdate)} className="space-y-4">
              <FormField
                control={dateForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('admin.invoices.table.date') || 'Invoice Date'}</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={dateForm.control}
                name="date_echeance"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('admin.invoices.table.dueDate') || 'Due Date'}</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {dateForm.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {dateForm.formState.errors.root.message}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDateModalOpen(false);
                    dateForm.reset({
                      date: invoice?.date ? new Date(invoice.date) : undefined,
                      //@ts-ignore
                      date_echeance: invoice?.date_echenace ? new Date(invoice.date_echenace) : undefined
                    });
                  }}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !dateForm.formState.isValid}
                >
                  {isSubmitting
                    ? "...."
                    : t('common.save') || 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Devalidate Invoice Modal */}
      <Dialog
        open={isDevalidateModalOpen}
        onOpenChange={setIsDevalidateModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.invoices.devalidateInvoice') || 'Devalidate Invoice'}</DialogTitle>
          </DialogHeader>
          <div className='p-4'>
            <p className='text-sm text-gray-700'>
              {t('admin.invoices.devalidateConfirmation') || 'Are you sure you want to devalidate this invoice?'}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDevalidateModalOpen(false)}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={async () => {
                if (!invoiceId) return;

                setIsSubmitting(true);
                try {
                  const response = await apiClient.post(
                    apiRoutes.admin.invoices.devalidate(invoiceId as string)
                  );

                  if (response.data?.success) {
                    toast.success(
                      t('admin.invoices.devalidateSuccess') ||
                        'Invoice devalidated successfully'
                    );
                    setInvoice((prev) => ({
                      ...prev!,
                      ...response.data.data,
                      media: response.data.data.media || []
                    }));
                    setIsDevalidateModalOpen(false);
                  } else {
                    throw new Error(
                      response.data?.message ||
                        t('admin.invoices.devalidateError') ||
                        'Failed to devalidate invoice'
                    );
                  }
                } catch (error: any) {
                  toast.error(
                    error.message ||
                      t('admin.invoices.devalidateError') ||
                      'Failed to devalidate invoice'
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? '....' : t('common.confirm') || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Reference Modal */}
      <Dialog
        open={isChangeReferenceModalOpen}
        onOpenChange={setIsChangeReferenceModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.invoices.changeReference') || 'Change Invoice Reference'}</DialogTitle>
          </DialogHeader>

          <div className='p-4'>
            <p className='mb-4 text-sm text-gray-500'>
              {t('admin.invoices.changeReferenceDescription') || 'Enter a new reference for the invoice.'}
            </p>
            <input
              type='text'
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
              className='w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500'
              placeholder={t('admin.invoices.reference') || 'Invoice Reference'}
            />
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsChangeReferenceModalOpen(false)}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              disabled={!newReference || isSubmitting}
              onClick={async () => {
                if (!invoiceId || !newReference) return;

                setIsSubmitting(true);
                try {
                  const response = await apiClient.put(
                    apiRoutes.admin.invoices.changeReference(invoiceId as string),
                    {
                      new_reference: newReference
                    }
                  );

                  if (response.data?.success) {
                    toast.success(
                      t('admin.invoices.referenceUpdateSuccess') || 'Invoice reference updated successfully'
                    );
                    setInvoice((prev) => ({
                      ...prev!,
                      reference: newReference
                    }));
                    setIsChangeReferenceModalOpen(false);
                    setNewReference('');
                  } else {
                    throw new Error(
                      response.data?.message ||
                        t('admin.invoices.referenceUpdateError') ||
                        'Failed to update invoice reference'
                    );
                  }
                } catch (error: any) {
                  // Extract error message from API response (especially for 422 errors)
                  const errorMessage = error?.response?.data?.message ||
                                     error?.message ||
                                     t('admin.invoices.referenceUpdateError') ||
                                     'Failed to update invoice reference';

                  toast.error(errorMessage);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? '....' : t('common.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
