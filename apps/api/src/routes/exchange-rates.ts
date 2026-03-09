import { Hono } from 'hono';

import { ErrorCode } from '@split-snap/shared/errors';
import { filterRates } from '@split-snap/shared/utilities';

import { badRequest, internal } from '../lib/errors';
import { exchangeRatesSchema } from '../lib/schemas';
import { ExchangeRateModel } from '../models/exchange-rate';

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

exchangeRateRoutes.put('/latest', async (c) => {
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

    // Parse the date and set time to start of day (00:00:00)
    const apiDate = new Date();
    const startOfDay = new Date(
      apiDate.getFullYear(),
      apiDate.getMonth(),
      apiDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      apiDate.getFullYear(),
      apiDate.getMonth(),
      apiDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const rates = filterRates(currencies, externalData.rates);

    // Transform to our schema format
    const exchangeRateData = {
      baseCurrency: externalData.base,
      date: apiDate,
      rates,
    };

    // Upsert: find by baseCurrency and date range (ignoring time), update or insert
    const result = await ExchangeRateModel.findOneAndUpdate(
      {
        baseCurrency: exchangeRateData.baseCurrency,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
      exchangeRateData,
      {
        returnDocument: 'after', // Return the updated document
        upsert: true, // Create if doesn't exist
      },
    );

    return c.json(result);
  } catch (err) {
    console.error('Exchange rate fetch error:', err);
    throw internal(
      ErrorCode.EXCHANGE_RATE_FETCH_FAILED,
      err instanceof Error ? err.message : undefined,
    );
  }
});

exchangeRateRoutes.get('/', async (c) => {
  try {
    const exchangeRates = await ExchangeRateModel.findOne().sort({ date: -1 });
    return c.json(exchangeRates);
  } catch (err) {
    console.error('Exchange rate retrieval error:', err);
    throw internal(
      ErrorCode.EXCHANGE_RATE_FETCH_FAILED,
      err instanceof Error ? err.message : undefined,
    );
  }
});
