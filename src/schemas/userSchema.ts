import * as z from 'zod';

// Schema for user creation/edition form
export const userFormSchema = z.object({
  // Personal information
  prenom: z.string().min(1, 'First name is required').max(255, 'First name cannot exceed 255 characters'),
  nom: z.string().min(1, 'Last name is required').max(255, 'Last name cannot exceed 255 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
  telephone: z.string()
    .regex(/^\+?[\d\s-]{6,}$/, 'Invalid phone number')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  
  // Password - optional for updates
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional()
    .or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'pending', 'suspended','inactive']).default('pending'),
  // Role is required
  role_id: z.string().min(1, 'Role is required'),
  
  // Optional personal details
  sexe: z.enum(['M', 'F', 'Autre']).optional(),
  date_naissance: z.date().optional().refine(date => date === undefined || date < new Date(), {
    message: 'Birth date must be in the past'
  }),
  
  // Address information - all optional
  adresse: z.string()
    .max(255, 'Address cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  ville: z.string()
    .max(255, 'City cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  code_postal: z.string()
    .max(20, 'Postal code cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  pays_id: z.string().optional(),
  
  // Professional information - all optional
  numero_secu: z.string()
    .max(20, 'Social security number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  siret: z.string()
    .max(14, 'SIRET cannot exceed 14 characters')
    .optional()
    .or(z.literal('')),
  
  // Emergency contact - all optional
  emergency_fullname: z.string()
    .max(255, 'Contact name cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  iban: z.string()
    .optional(),
  bank_name: z.string(),
  emergency_tel: z.string()
    .regex(/^\+?[\d\s-]{6,}$/, 'Invalid phone number')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  emergency_relation: z.string()
    .max(100, 'Relationship cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
}).refine(
  data => !data.password || !data.password_confirmation || data.password === data.password_confirmation, 
  {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  }
);

// Type inference from the schema
export type UserFormValues = z.infer<typeof userFormSchema>;

// Default form values
export const defaultUserFormValues: Partial<UserFormValues> = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  password: '',
  password_confirmation: '',
  sexe: undefined,
  date_naissance: undefined,
  role_id: '',
  adresse: '',
  ville: '',
  code_postal: '',
  pays_id: '',
  numero_secu: '',
  emergency_fullname: '',
  emergency_tel: '',
  emergency_relation: '',
  status: 'active',
  bank_name:'',
  iban:''
};