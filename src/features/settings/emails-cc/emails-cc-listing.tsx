'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { Loader2, AlertCircle, Mail, Pencil, Trash2, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const emailCCFormSchema = z.object({
  email: z.string().email("Valid email is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

interface EmailCC {
  id: number;
  email: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

type EmailCCFormValues = z.infer<typeof emailCCFormSchema>;

const defaultEmailCCFormValues: EmailCCFormValues = {
  email: "",
  description: "",
  is_active: true
};

export default function EmailCCListing() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // States
  const [emailsCC, setEmailsCC] = useState<EmailCC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<EmailCC | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form setup
  const form = useForm<EmailCCFormValues>({
    resolver: zodResolver(emailCCFormSchema),
    defaultValues: defaultEmailCCFormValues,
    mode: 'onChange'
  });

  // Clean up URL on component mount
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', pathname);
    }
  }, [pathname]);

  // Fetch email CCs
  const fetchEmailsCC = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`${apiRoutes.admin.settings.emailsCC.list}`);

      if (response.data.success) {
        setEmailsCC(response.data.data || []);
      } else {
        setError(t('admin.settings.emailsCC.error.fetchFailed'));
        toast.error(t('admin.settings.emailsCC.toast.loadFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('admin.settings.emailsCC.error.fetchFailed'));
      toast.error(t('admin.settings.emailsCC.toast.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load emails on mount
  useEffect(() => {
    fetchEmailsCC();
  }, []);

  // Add email CC
  const addEmailCC = async (data: EmailCCFormValues) => {
    setFormLoading(true);
    try {
      await apiClient.post(apiRoutes.admin.settings.emailsCC.create, {
        email: data.email,
        description: data.description,
        active: data.is_active
      });
      toast.success(t('admin.settings.emailsCC.toast.addSuccess'));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.emailsCC.toast.addFailed'));
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  // Update email CC
  const updateEmailCC = async (data: EmailCCFormValues) => {
    setFormLoading(true);
    try {
      await apiClient.put(apiRoutes.admin.settings.emailsCC.update(editingId!), {
        email: data.email,
        description: data.description,
        active: data.is_active
      });
      toast.success(t('admin.settings.emailsCC.toast.updateSuccess'));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.emailsCC.toast.updateFailed'));
      return false;
    } finally {
      setFormLoading(false);
    }
  };


  // Delete email CC
  const deleteEmailCC = async () => {
    if (!emailToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(apiRoutes.admin.settings.emailsCC.delete(emailToDelete.id));
      toast.success(t('admin.settings.emailsCC.toast.deleteSuccess'));
      setIsDeleteModalOpen(false);
      fetchEmailsCC();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('admin.settings.emailsCC.toast.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Form submission
  const onSubmit = async (data: EmailCCFormValues) => {
    try {
      let success;

      if (isEditing && editingId !== null) {
        success = await updateEmailCC(data);
      } else {
        success = await addEmailCC(data);
      }

      if (success) {
        form.reset(defaultEmailCCFormValues);
        setIsEditing(false);
        setEditingId(null);
        fetchEmailsCC();
      }
    } catch (error) {
      toast.error(isEditing
        ? t('admin.settings.emailsCC.toast.updateFailed')
        : t('admin.settings.emailsCC.toast.addFailed')
      );
    }
  };

  // Edit email
  const handleEdit = (email: EmailCC) => {
    form.reset({
      email: email.email,
      description: email.description || '',
      is_active: email.is_active
    });
    setEditingId(email.id);
    setIsEditing(true);
  };

  // Cancel edit
  const cancelEdit = () => {
    form.reset(defaultEmailCCFormValues);
    setIsEditing(false);
    setEditingId(null);
  };

  // Open delete modal
  const handleOpenDeleteModal = (email: EmailCC) => {
    setEmailToDelete(email);
    setIsDeleteModalOpen(true);
  };

  const isEmptyList = !isLoading && emailsCC.length === 0;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className='flex items-start justify-between'>
        <Heading
          title={t('admin.settings.emailsCC.listing.title') || "Email CC Management"}
          description={t('admin.settings.emailsCC.listing.description') || "Manage email addresses that will be added in CC for notifications."}
        />
      </div>
      <Separator />

      {/* Form Card */}
      <Card className="shadow-sm bg-white border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                <div className="flex-1 min-w-[150px]">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium">
                          {t('admin.settings.emailsCC.form.email') || "Email"}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('admin.settings.emailsCC.form.emailPlaceholder') || "example@domain.com"}
                            className="h-8 text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1 min-w-[150px]">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium">
                          {t('admin.settings.emailsCC.form.description') || "Description"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('admin.settings.emailsCC.form.descriptionPlaceholder') || "Optional description"}
                            className="h-8 text-sm"
                          />
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
                      {t('admin.settings.emailsCC.actions.cancel') || "Cancel"}
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="h-8 text-xs py-0 px-3"
                  >
                    {formLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {isEditing
                      ? formLoading
                        ? (t('admin.settings.emailsCC.actions.updating') || "Updating...")
                        : (t('admin.settings.emailsCC.actions.update') || "Update")
                      : formLoading
                        ? (t('admin.settings.emailsCC.actions.adding') || "Adding...")
                        : (t('admin.settings.emailsCC.actions.add') || "Add")
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>

      {/* Empty state alerts */}
      {isEmptyList && (
        <Alert className="bg-amber-50 border-amber-200">
          <Mail className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">
            {t('admin.settings.emailsCC.alerts.noEmailsTitle') || "No email addresses found"}
          </AlertTitle>
          <AlertDescription className="text-amber-600">
            {t('admin.settings.emailsCC.alerts.noEmailsDesc') || "Add email addresses that will be included in CC for notifications."}
          </AlertDescription>
        </Alert>
      )}

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Emails table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : emailsCC.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.settings.emailsCC.table.email') || "Email"}</TableHead>
                <TableHead>{t('admin.settings.emailsCC.table.description') || "Description"}</TableHead>
                <TableHead className="w-[100px] text-right">{t('admin.settings.emailsCC.table.actions') || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailsCC.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium">{email.email}</TableCell>
                  <TableCell>{email.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(email)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleOpenDeleteModal(email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.settings.emailsCC.deleteModal.title') || "Delete Email CC"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.settings.emailsCC.deleteModal.description') ||
                `Are you sure you want to delete? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('admin.settings.emailsCC.deleteModal.cancel') || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteEmailCC();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.settings.emailsCC.deleteModal.deleting') || "Deleting..."}
                </>
              ) : (
                t('admin.settings.emailsCC.deleteModal.confirm') || "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}