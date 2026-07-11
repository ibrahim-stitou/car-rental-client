'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from './user-auth-form';
import Logo from '@/components/logo';
import { IconBrandGoogle } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Authentication - MyFleet-Control',
  description: 'Secure login to your MyFleet-Control account',
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className="relative flex h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/10 overflow-hidden">
      {/* Floating Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-float opacity-60" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float-delay opacity-60" />
        <div className="hidden lg:block absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center bg-repeat opacity-5 pointer-events-none" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white/90 px-8 py-10 shadow-2xl backdrop-blur-md">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <Logo />
        </div>

        {/* Welcome Text */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>
        {/* Auth Form */}
        <UserAuthForm />
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(20px) rotate(-5deg);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
