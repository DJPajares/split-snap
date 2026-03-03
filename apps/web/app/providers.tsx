'use client';

import { useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/hooks/useAuth';
import { ErrorModalProvider } from '@/app/error-modal-context';
import { api } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    void api.health.check().catch((error) => {
      console.error('Health check failed:', error);
    });
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <ErrorModalProvider>
        <AuthProvider>{children}</AuthProvider>
      </ErrorModalProvider>
    </HeroUIProvider>
  );
}
