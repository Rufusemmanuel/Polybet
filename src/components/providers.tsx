/* Client-side providers for React Query + injected wallet */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ThemeProvider } from '@/components/theme-context';
import { InjectedWalletProvider } from '@/hooks/useInjectedWallet';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <InjectedWalletProvider>
        <ThemeProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </InjectedWalletProvider>
    </QueryClientProvider>
  );
}
