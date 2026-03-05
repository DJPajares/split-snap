import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Session Schemas ───────────────────────────────────────

export const joinSessionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be 30 characters or fewer')
    .transform((val) => val.trim()),
});

// ─── Item Editor Schemas ───────────────────────────────────

export type AmountMode = '$' | '%';

export const itemRowSchema = z.object({
  name: z.string(),
  amount: z.string(),
  quantity: z.string(),
});

export const itemEditorSchema = z.object({
  currency: z.string(),
  items: z.array(itemRowSchema).min(1, 'At least one item is required'),
  tax: z.string(),
  tip: z.string(),
  taxMode: z.enum(['$', '%']),
  tipMode: z.enum(['$', '%']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type JoinSessionFormData = z.infer<typeof joinSessionSchema>;
export type ItemEditorFormData = z.infer<typeof itemEditorSchema>;
