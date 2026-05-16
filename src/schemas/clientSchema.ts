import * as z from 'zod';

// Schema for client creation/edition form
export const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  capital: z
    .string()
    .min(0, 'Capital must be a positive number')
    .optional()
    .or(z.literal('')),
  idnumber: z.string().min(1, 'Identifier is required').max(255, 'Identifier cannot exceed 255 characters'),
  address: z.string().min(1, 'Address is required').max(255, 'Address cannot exceed 255 characters'),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{6,}$/, 'Invalid phone number')
    .max(20, 'Phone number cannot exceed 20 characters'),
  mail: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
  country_id: z.string().min(1, 'Country is required'),
  code_postal: z.string().min(1, 'Postal code is required').max(20, 'Postal code cannot exceed 20 characters'),
  city: z.string().min(1, 'City is required').max(255, 'City cannot exceed 255 characters'),
  // iban: z.string().min(1, 'IBAN is required').max(255, 'IBAN cannot exceed 255 characters').optional(),
  // bic: z.string().min(1, 'BIC is required').max(255, 'BIC cannot exceed 255 characters').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  reference_special:z.string().nullable().optional(),
});

// Type inference from the schema
export type ClientFormValues = z.infer<typeof clientFormSchema>;

// Default form values
export const defaultClientFormValues = {
  name: "",
  idnumber: "",
  capital: "",
  phone: "",
  mail: "",
  status: "active",
  address: "",
  city: "",
  code_postal: "",
  reference_special:"",
  country_id: "",
  // iban: "",
  // bic: "",
}