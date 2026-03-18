import { STORAGE_KEYS } from '@split-snap/shared/constants';
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

        sessionStorage.setItem(
          STORAGE_KEYS.KEY_EXCHANGE_RATES,
          JSON.stringify(rates),
        );
      } catch {
        // Ignore exchange rate errors silently, summary will fallback to default rates
      }
    };

    const cachedRates = sessionStorage.getItem(STORAGE_KEYS.KEY_EXCHANGE_RATES);
    if (!cachedRates) {
      fetchExchangeRates();
    }
  }, []);

  return <>{children}</>;
};
