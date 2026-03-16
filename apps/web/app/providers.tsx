'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from 'next-themes';

import { ErrorModalProvider } from '@/components/error/error-modal-context';
import { AuthProvider } from '@/hooks/useAuth';

import { ClientDataProvider } from '../providers/clientDataProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <ToastProvider />
        <ClientDataProvider>
          <ErrorModalProvider>
            <AuthProvider>{children}</AuthProvider>
          </ErrorModalProvider>
        </ClientDataProvider>
      </ThemeProvider>
    </HeroUIProvider>
  );
}
