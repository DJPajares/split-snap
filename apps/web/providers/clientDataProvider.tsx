import { useEffect } from 'react';

import { api } from '@/lib/api';

export const ClientDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { rates } = await api.exchangeRates.get();

        sessionStorage.setItem('exchange_rates', JSON.stringify(rates));
      } catch {
        // Ignore exchange rate errors silently, summary will fallback to default rates
      }
    };

    const cachedRates = sessionStorage.getItem('exchange_rates');
    if (!cachedRates) {
      fetchExchangeRates();
    }
  }, []);

  return <>{children}</>;
};
