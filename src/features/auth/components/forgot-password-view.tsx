'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import { paths } from '@/config/paths';

const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordView() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await apiClient.post(apiRoutes.auth.forgotPassword, { email: values.email });
        setSent(true);
        toast.success('Reset link sent — check your inbox');
      } catch {
        toast.error('An error occurred. Please try again.');
      }
    });
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold">Check your inbox</h3>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to your email address.
        </p>
        <Button variant="outline" asChild>
          <Link href={paths.auth.signIn}>Back to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Forgot Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email to receive a reset link
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <Button variant="outline" type="button" className="w-full" asChild>
              <Link href={paths.auth.signIn}>Back to Sign In</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
