import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createClaimSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').default(''),
});

export const updateClaimSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
});

export const actionNoteSchema = z.object({
  note: z.string().max(1000, 'Note must not exceed 1000 characters').optional(),
});

export const sendBackSchema = z.object({
  reason: z.string({
    required_error: 'Reason is required',
  })
  .min(10, 'Reason must be at least 10 characters')
  .max(500, 'Reason must not exceed 500 characters'),
});
