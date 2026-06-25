'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Hash, Minus, Plus, Eye } from 'lucide-react';
import { useSettingGroup, useUpdateSettings } from '../hooks/use-settings';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';

// ─── Document type definitions ────────────────────────────────────────────────
const TYPES = [
  { key: 'fa',          label: 'Facture',           code: 'FA',  defaultPrefix: 'FA',  defaultDigits: 6, bgColor: 'bg-emerald-500', badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'av',          label: 'Avoir',              code: 'AV',  defaultPrefix: 'AV',  defaultDigits: 6, bgColor: 'bg-rose-500',    badgeCls: 'bg-rose-100 text-rose-800 border-rose-200'         },
  { key: 'dv',          label: 'Devis',              code: 'DV',  defaultPrefix: 'DV',  defaultDigits: 6, bgColor: 'bg-blue-500',    badgeCls: 'bg-blue-100 text-blue-800 border-blue-200'         },
  { key: 'bc',          label: 'Bon de Commande',    code: 'BC',  defaultPrefix: 'BC',  defaultDigits: 6, bgColor: 'bg-violet-500',  badgeCls: 'bg-violet-100 text-violet-800 border-violet-200'   },
  { key: 'bl',          label: 'Bon de Livraison',   code: 'BL',  defaultPrefix: 'BL',  defaultDigits: 6, bgColor: 'bg-cyan-500',    badgeCls: 'bg-cyan-100 text-cyan-800 border-cyan-200'         },
  { key: 'br',          label: 'Bon de Réception',   code: 'BR',  defaultPrefix: 'BR',  defaultDigits: 6, bgColor: 'bg-orange-500',  badgeCls: 'bg-orange-100 text-orange-800 border-orange-200'   },
  { key: 'reservation', label: 'Réservation',        code: 'RES', defaultPrefix: 'RES', defaultDigits: 6, bgColor: 'bg-slate-500',   badgeCls: 'bg-slate-100 text-slate-800 border-slate-200'      },
] as const;

type TypeKey = typeof TYPES[number]['key'];

// ─── Zod schema (explicit for full type safety) ───────────────────────────────
const schema = z.object({
  fa_prefix:             z.string().min(1, 'Requis'),
  fa_separator:          z.string(),
  fa_digits:             z.coerce.number().int().min(1).max(10),
  fa_current:            z.coerce.number().int().min(0),
  av_prefix:             z.string().min(1, 'Requis'),
  av_separator:          z.string(),
  av_digits:             z.coerce.number().int().min(1).max(10),
  av_current:            z.coerce.number().int().min(0),
  dv_prefix:             z.string().min(1, 'Requis'),
  dv_separator:          z.string(),
  dv_digits:             z.coerce.number().int().min(1).max(10),
  dv_current:            z.coerce.number().int().min(0),
  bc_prefix:             z.string().min(1, 'Requis'),
  bc_separator:          z.string(),
  bc_digits:             z.coerce.number().int().min(1).max(10),
  bc_current:            z.coerce.number().int().min(0),
  bl_prefix:             z.string().min(1, 'Requis'),
  bl_separator:          z.string(),
  bl_digits:             z.coerce.number().int().min(1).max(10),
  bl_current:            z.coerce.number().int().min(0),
  br_prefix:             z.string().min(1, 'Requis'),
  br_separator:          z.string(),
  br_digits:             z.coerce.number().int().min(1).max(10),
  br_current:            z.coerce.number().int().min(0),
  reservation_prefix:    z.string().min(1, 'Requis'),
  reservation_separator: z.string(),
  reservation_digits:    z.coerce.number().int().min(1).max(10),
  reservation_current:   z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

function makePreview(prefix: string, sep: string, digits: number, current: number): string {
  const next = Math.max(1, Number(current) + 1);
  const d = Math.max(1, Math.min(10, Number(digits)));
  return `${prefix || '?'}${sep}${'0'.repeat(Math.max(0, d - String(next).length))}${next}`;
}

// ─── Single type card ─────────────────────────────────────────────────────────
function TypeCounterCard({
  t,
  form,
}: {
  t: typeof TYPES[number];
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const prefix  = useWatch({ control: form.control, name: `${t.key}_prefix`    as keyof FormValues }) as string;
  const sep     = useWatch({ control: form.control, name: `${t.key}_separator` as keyof FormValues }) as string;
  const digits  = useWatch({ control: form.control, name: `${t.key}_digits`    as keyof FormValues }) as number;
  const current = useWatch({ control: form.control, name: `${t.key}_current`   as keyof FormValues }) as number;

  const preview = makePreview(prefix, sep, digits, current);

  const step = (delta: number) => {
    const key = `${t.key}_current` as keyof FormValues;
    const val = Number(form.getValues(key)) || 0;
    form.setValue(key, Math.max(0, val + delta) as any, { shouldDirty: true });
  };

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      {/* Colored top bar */}
      <div className={`h-1.5 w-full ${t.bgColor}`} />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className={`text-xs font-semibold font-mono mb-1.5 ${t.badgeCls}`}>
              {t.code}
            </Badge>
            <p className="text-sm font-semibold leading-tight">{t.label}</p>
          </div>
          {/* Live preview badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border text-xs text-muted-foreground shrink-0">
            <Eye className="h-3 w-3" />
            <code className="font-mono font-medium text-foreground">{preview}</code>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 3 config fields */}
        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name={`${t.key}_prefix` as keyof FormValues} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Préfixe</FormLabel>
              <FormControl>
                <Input placeholder={t.defaultPrefix} maxLength={10} className="h-8 text-sm font-mono" {...(field as any)} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name={`${t.key}_separator` as keyof FormValues} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Séparateur</FormLabel>
              <FormControl>
                <Input placeholder="-" maxLength={3} className="h-8 text-sm text-center font-mono" {...(field as any)} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name={`${t.key}_digits` as keyof FormValues} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Chiffres</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={10} className="h-8 text-sm text-center" {...(field as any)} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
        </div>

        <Separator />

        {/* Counter stepper */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Compteur actuel <span className="text-[10px] text-muted-foreground/70">(prochain = actuel + 1)</span></p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => step(-1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <FormField control={form.control} name={`${t.key}_current` as keyof FormValues} render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-center font-mono text-sm font-semibold"
                    {...(field as any)}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => step(1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
            Prochain numéro généré : <code className="font-mono font-semibold text-foreground">{preview}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function CounterSettingsView() {
  const { data, isLoading } = useSettingGroup('counters');
  const updateSettings = useUpdateSettings('counters');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fa_prefix: 'FA',   fa_separator: '-', fa_digits: 6,   fa_current: 0,
      av_prefix: 'AV',   av_separator: '-', av_digits: 6,   av_current: 0,
      dv_prefix: 'DV',   dv_separator: '-', dv_digits: 6,   dv_current: 0,
      bc_prefix: 'BC',   bc_separator: '-', bc_digits: 6,   bc_current: 0,
      bl_prefix: 'BL',   bl_separator: '-', bl_digits: 6,   bl_current: 0,
      br_prefix: 'BR',   br_separator: '-', br_digits: 6,   br_current: 0,
      reservation_prefix: 'RES', reservation_separator: '-', reservation_digits: 6, reservation_current: 0,
    },
  });

  useEffect(() => {
    const s = (data as any)?.data ?? {};
    if (!Object.keys(s).length) return;
    form.reset({
      fa_prefix: s.fa_prefix ?? 'FA',   fa_separator: s.fa_separator ?? '-', fa_digits: Number(s.fa_digits ?? 6),   fa_current: Number(s.fa_current ?? 0),
      av_prefix: s.av_prefix ?? 'AV',   av_separator: s.av_separator ?? '-', av_digits: Number(s.av_digits ?? 6),   av_current: Number(s.av_current ?? 0),
      dv_prefix: s.dv_prefix ?? 'DV',   dv_separator: s.dv_separator ?? '-', dv_digits: Number(s.dv_digits ?? 6),   dv_current: Number(s.dv_current ?? 0),
      bc_prefix: s.bc_prefix ?? 'BC',   bc_separator: s.bc_separator ?? '-', bc_digits: Number(s.bc_digits ?? 6),   bc_current: Number(s.bc_current ?? 0),
      bl_prefix: s.bl_prefix ?? 'BL',   bl_separator: s.bl_separator ?? '-', bl_digits: Number(s.bl_digits ?? 6),   bl_current: Number(s.bl_current ?? 0),
      br_prefix: s.br_prefix ?? 'BR',   br_separator: s.br_separator ?? '-', br_digits: Number(s.br_digits ?? 6),   br_current: Number(s.br_current ?? 0),
      reservation_prefix: s.reservation_prefix ?? 'RES',
      reservation_separator: s.reservation_separator ?? '-',
      reservation_digits: Number(s.reservation_digits ?? 6),
      reservation_current: Number(s.reservation_current ?? 0),
    });
  }, [data, form]);

  const onSubmit = (values: FormValues) => {
    updateSettings.mutate(values as any, {
      onSuccess: () => toast.success('Compteurs enregistrés avec succès'),
      onError: () => toast.error('Impossible de mettre à jour les compteurs'),
    });
  };

  return (
    <PageContainer scrollable>
      <div className="p-6 w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings"><ArrowLeft className="h-4 w-4 mr-1" />Paramètres</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Hash className="h-6 w-6 text-muted-foreground" />
              Gestion des Compteurs
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Configuration individuelle des numéros de séquence par type de document
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {TYPES.map((t) => (
                  <TypeCounterCard key={t.key} t={t} form={form} />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Les modifications s&apos;appliquent immédiatement aux prochains documents créés.
                </p>
                <Button type="submit" disabled={updateSettings.isPending} size="lg" className="min-w-40">
                  {updateSettings.isPending ? 'Enregistrement…' : 'Enregistrer tout'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </PageContainer>
  );
}
