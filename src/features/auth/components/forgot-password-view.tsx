'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValue = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [loading, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValue) => {
    startTransition(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Request failed');
          return;
        }

        setEmailSent(true);
        toast.success('Reset email has been sent');
      } catch (error) {
        toast.error('An error occurred while sending the email');
      }
    });
  };

  return (
    <div className="w-full space-y-4">
      {emailSent ? (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Email Sent</h3>
          <p className="mt-2 text-sm text-gray-600">
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            asChild
          >
            <Link href="/auth/signin">Back to Login</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">Forgot Password</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter your email address to receive a reset link
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email..."
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button
                  disabled={loading}
                  className="w-full"
                  type="submit"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  asChild
                >
                  <Link href="/auth/signin">Back to Login</Link>
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}