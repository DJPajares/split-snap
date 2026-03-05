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

const isFiniteNumber = (value: string) => Number.isFinite(Number(value));

export const itemRowSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine(isFiniteNumber, 'Amount must be a valid number')
    .refine((value) => Number(value) >= 0, 'Amount cannot be negative'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Quantity is required')
    .refine(isFiniteNumber, 'Quantity must be a valid number')
    .refine(
      (value) => Number.isInteger(Number(value)),
      'Quantity must be whole',
    )
    .refine((value) => Number(value) >= 1, 'Quantity must be at least 1'),
});

export const itemEditorSchema = z
  .object({
    currency: z.string(),
    items: z.array(itemRowSchema).min(1, 'At least one item is required'),
    tax: z
      .string()
      .trim()
      .min(1, 'Tax is required')
      .refine(isFiniteNumber, 'Tax must be a valid number'),
    tip: z
      .string()
      .trim()
      .min(1, 'Service charge/tip is required')
      .refine(isFiniteNumber, 'Service charge/tip must be a valid number'),
    taxMode: z.enum(['$', '%']),
    tipMode: z.enum(['$', '%']),
  })
  .superRefine((data, ctx) => {
    const tax = Number(data.tax);
    const tip = Number(data.tip);

    if (Number.isFinite(tax) && tax < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tax'],
        message: 'Tax cannot be negative',
      });
    }
    if (Number.isFinite(tip) && tip < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tip'],
        message: 'Service charge/tip cannot be negative',
      });
    }
    if (data.taxMode === '%' && Number.isFinite(tax) && tax > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tax'],
        message: 'Tax percentage cannot exceed 100%',
      });
    }
    if (data.tipMode === '%' && Number.isFinite(tip) && tip > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tip'],
        message: 'Tip percentage cannot exceed 100%',
      });
    }
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type JoinSessionFormData = z.infer<typeof joinSessionSchema>;
export type ItemEditorFormData = z.infer<typeof itemEditorSchema>;
