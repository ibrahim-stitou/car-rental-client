import * as z from 'zod';

export const createMissionFormSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, { message: t('admin.missions.form.required') }),
  client_id: z.string().min(1, { message: t('admin.missions.form.required') }),
  user_id: z.string().min(1, { message: t('admin.missions.form.required') }),
  status: z.enum(['active','inactive'], {
    required_error: t('admin.missions.form.required'),
  }),
  tjm: z.union([
    z.number().positive({ message: t('admin.missions.form.invalidTjm') }),
    z.string()
  ]),
  tjm_type: z.enum(['forfait', 'journalier'], {
    required_error: t('admin.missions.form.required'),
  }),
  date_debut: z.date({
    required_error: t('admin.missions.form.required'),
  }),
  date_fin: z.date().nullable().optional(),
  description: z.string().min(1, { message: t('admin.missions.form.required') }),
  country_id: z.string().min(1, { message: t('admin.missions.form.required') }),
  adresse_prin: z.string().min(1, { message: t('admin.missions.form.required') }),
  consultant_reference: z
    .string()
    .max(255, { message: t('admin.missions.form.max255') })
    .nullable()
    .optional(),
  mission_document_paths: z.array(z.string()).optional().nullable(),
  // Backward compat (si backend envoie encore mission_document_path)
  mission_document_path: z.string().nullable().optional(),
  taux_fkm: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || !isNaN(parseFloat(val)), {
      message: t('admin.missions.form.invalidTauxFkm') || 'Mileage rate must be a valid number',
    })
    .transform((val) => (val === '' || !val ? null : val)),
});

export const defaultMissionFormValues = {
  title: '',
  client_id: '',
  user_id: '',
  status: 'active' as const,
  tjm: 0,
  tjm_type: 'journalier' as const,
  date_debut: undefined,
  date_fin: undefined,
  description: '',
  country_id: '',
  adresse_prin: '',
  consultant_reference: null as string | null,
  mission_document_paths: [] as string[],
  mission_document_path: null,
  taux_fkm: '',
};