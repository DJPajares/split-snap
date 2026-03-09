import { Hono } from 'hono';

import { ErrorCode } from '@split-snap/shared/errors';
import { filterRates } from '@split-snap/shared/utilities';

import { badRequest, internal } from '../lib/errors';
import { exchangeRatesSchema } from '../lib/schemas';

export const exchangeRateRoutes = new Hono();

exchangeRateRoutes.post('/latest', async (c) => {
  const body = await c.req.json();
  const parsed = exchangeRatesSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten(),
    );
  }

  const { currencies } = parsed.data;

  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
    );

    if (!response.ok) {
      throw badRequest(
        ErrorCode.EXCHANGE_RATE_FETCH_FAILED,
        'Failed to fetch exchange rates from external API',
      );
    }

    const externalData = await response.json();

    const rates = filterRates(currencies, externalData.rates);

    // Transform to our schema format
    const exchangeRateData = {
      baseCurrency: externalData.base,
      date: new Date(externalData.date),
      rates,
    };

    return c.json(exchangeRateData);
  } catch (err) {
    console.error('Exchange rate fetch error:', err);
    throw internal(
      ErrorCode.EXCHANGE_RATE_FETCH_FAILED,
      err instanceof Error ? err.message : undefined,
    );
  }
});
