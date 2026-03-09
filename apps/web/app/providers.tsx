'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { ErrorModalProvider } from '@/components/error/ErrorModalContext';
import { AuthProvider } from '@/hooks/useAuth';

import { ClientDataProvider } from '../providers/clientDataProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider />
      <ClientDataProvider>
        <ErrorModalProvider>
          <AuthProvider>{children}</AuthProvider>
        </ErrorModalProvider>
      </ClientDataProvider>
    </HeroUIProvider>
  );
}
