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
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();

  const defaultValues = {
    email: '',
    password: ''
  };

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  const onSubmit = async (data: UserFormValue) => {
    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl: callbackUrl ?? '/admin'
        });

        if (result?.error) {
          toast.error('Invalid credentials');
        } else {
          const session = await fetch('/api/auth/session').then((res) => res.json());

          if (session?.user?.role?.code === 'admin') {
            toast.success('Signed In Successfully!');
            window.location.href = '/admin';
          } else if (session?.user?.role?.code === 'consultant') {
            toast.success('Signed In Successfully!');
            window.location.href = '/consultant';
          } else {
            toast.error('Unauthorized role');
          }
        }
      } catch (error) {
        toast.error('Something went wrong');
      }
    });
  };
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-2'
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Enter your email...'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your password...'
                      disabled={loading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline d-flex justify-end"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className='mt-2 ml-auto w-full'
            type='submit'
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>
    </>
  );
}