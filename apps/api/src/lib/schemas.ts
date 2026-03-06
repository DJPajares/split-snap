import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createSessionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().int().min(1).default(1),
    }),
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  tip: z.number().min(0).default(0),
  taxMode: z.enum(['$', '%']).default('$'),
  tipMode: z.enum(['$', '%']).default('$'),
  total: z.number().min(0),
  currency: z.string().default('SGD'),
  receiptImageUrl: z.string().nullable().optional(),
});

export const joinSchema = z.object({
  displayName: z.string().min(1).max(30),
  userId: z.string().nullable().optional(),
});

export const claimSchema = z.object({
  participantId: z.string(),
  portion: z.number().min(0).max(1).default(1),
});

export const claimAllSchema = z.object({
  participantId: z.string(),
  claimAll: z.boolean(),
  portion: z.number().min(0).max(1).default(1),
});

export const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().int().min(1).default(1),
    }),
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  tip: z.number().min(0).default(0),
  taxMode: z.enum(['$', '%']).default('$'),
  tipMode: z.enum(['$', '%']).default('$'),
  total: z.number().min(0),
  currency: z.string().optional(),
});

export const upgradeSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(30),
});

export const mergeSchema = z.object({
  fromParticipantId: z.string().min(1),
  toUserId: z.string().min(1),
  toDisplayName: z.string().min(1).max(30),
});

export const settingsSchema = z.object({
  requireApproval: z.boolean().optional(),
});
