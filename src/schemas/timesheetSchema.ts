import * as z from 'zod';

export const timesheetSchema = z.object({
  month: z.string().min(1, { message: 'Month is required' }),
  year: z.number().int().min(1900, { message: 'Year must be valid' }),
  status: z.enum(['draft', 'review', 'validated', 'corrected', 'rejected'], {
    required_error: 'Status is required',
  }).default('draft'),
  mission_id: z.string().min(1, { message: 'Mission ID is required' }),
  days_nbr: z.number().int().positive({ message: 'Number of days must be positive' }),
  absense: z.number().int().nonnegative({ message: 'Absence must be non-negative' }).default(0),
  user_id: z.string().min(1, { message: 'User ID is required' }),
  deleted_at: z.date().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const defaultTimesheetValues = {
  month: '',
  year: new Date().getFullYear(),
  status: 'draft',
  mission_id: '',
  days_nbr: 0,
  absense: 0,
  user_id: '',
  deleted_at: null,
  created_at: undefined,
  updated_at: undefined,
};