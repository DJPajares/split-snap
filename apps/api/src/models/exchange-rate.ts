import mongoose, { Document, Schema } from 'mongoose';

export interface IExchangeRate extends Document {
  baseCurrency: string;
  date: Date;
  rates: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    baseCurrency: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    rates: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true },
);

export const ExchangeRateModel =
  mongoose.models.ExchangeRate ||
  mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
