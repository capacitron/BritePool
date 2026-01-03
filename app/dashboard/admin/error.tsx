'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
        <h2 className="mt-6 text-2xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">
          An error occurred while loading this page. Please try again or return to the dashboard.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-left text-xs max-h-32">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
