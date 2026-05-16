import { z } from 'zod';

const paymentSchema = z.object({
    paymentMode: z
    .string()
    .nonempty('Payment mode is required')
    .refine((value) => ['especes', 'virement', 'carte', 'cheque', 'autre'].includes(value), {
      message: 'Invalid payment mode',
    }),
  payDate: z.date({
    required_error: 'Payment date is required',
    invalid_type_error: 'Invalid date format',
  }),
  bank_id: z.number({
    required_error: 'Bank is required',
  }),
  amountHT: z
    .string()
    .nonempty('Amount HT is required')
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
      message: 'Amount HT must be a positive number',
    }),
  amountTTC: z
    .string()
    .nonempty('Amount TTC is required')
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
      message: 'Amount TTC must be a positive number',
    }),
});

export default paymentSchema;