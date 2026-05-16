'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps, toast } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: '!bg-background !text-foreground !border-border',
          success: '!bg-green-500 !text-white !border-green-600',
          error: '!bg-red-500 !text-white !border-red-600',
          warning: '!bg-yellow-500 !text-white !border-yellow-600',
          info: '!bg-blue-500 !text-white !border-blue-600',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };