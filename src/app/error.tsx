// app/error.tsx
'use client';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (error.message === '403') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <h1>403 - Forbidden</h1>
        <p>You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

}
