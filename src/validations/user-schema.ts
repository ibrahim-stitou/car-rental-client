// src/validations/user-schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().optional(),
  nom: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  prenom: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  telephone: z.string()
    .regex(/^\+?[0-9\s]{10,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  role_id: z.number()
    .min(1, 'Please select a role')
    .max(3, 'Invalid role'),
  sexe: z.string()
    .max(1, 'Invalid value')
    .nullable(),
  adresse: z.string()
    .max(200, 'Address cannot exceed 200 characters')
    .optional()
    .nullable(),
  ville: z.string()
    .max(50, 'City cannot exceed 50 characters')
    .optional()
    .nullable(),
  code_postal: z.string()
    .max(10, 'Postal code cannot exceed 10 characters')
    .optional()
    .nullable(),
  date_naissance: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  numero_secu: z.string()
    .regex(/^[\d\s]{15}$/, 'Invalid social security number')
    .optional()
    .nullable(),
  siret: z.string()
    .regex(/^[\d\s]{14}$/, 'Invalid SIRET number')
    .optional()
    .nullable(),
  raison_sociale: z.string()
    .max(100, 'Company name cannot exceed 100 characters')
    .optional()
    .nullable(),
  documents: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string(),
      url: z.string(),
      mime_type: z.string(),
      size: z.number(),
      collection: z.string(),
    })
  ).optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;
