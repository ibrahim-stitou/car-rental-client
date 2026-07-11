'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, UserPlus, X } from 'lucide-react';
import {
  useCreateRole, useUpdateRole, useAssignPermissions, usePermissions,
  useRoleUsers, useAttachUserToRole, useDetachUserFromRole,
} from '../hooks/use-roles';
import { useUsers } from '@/features/users/hooks/use-users';
import type { Role } from '@/types/role.types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SelectField } from '@/components/shared/select-field';
import PageContainer from '@/components/layout/page-container';
import { applyServerErrors } from '@/lib/form-errors';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
});

type FormValues = z.infer<typeof schema>;

const SYSTEM_ROLES = ['super-admin', 'admin'];

interface Props {
  role?: Role | null;
}

export function RoleFormView({ role }: Props) {
  const router = useRouter();
  const isEdit = !!role;
  const isSystemRole = !!role && SYSTEM_ROLES.includes(role.name);

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(role?.id ?? '');
  const assignMutation = useAssignPermissions(role?.id ?? '');
  const { data: permissionsRes } = usePermissions();
  const allPermissions = permissionsRes?.data ?? [];

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set((role?.permissions ?? []).map((p) => p.name))
  );

  const isPending = createMutation.isPending || updateMutation.isPending || assignMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: role?.name ?? '' },
  });

  useEffect(() => {
    form.reset({ name: role?.name ?? '' });
    setSelectedPermissions(new Set((role?.permissions ?? []).map((p) => p.name)));
  }, [role, form]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, typeof allPermissions>();
    allPermissions.forEach((p) => {
      const mod = p.module ?? 'Autre';
      if (!groups.has(mod)) groups.set(mod, []);
      groups.get(mod)!.push(p);
    });
    return Array.from(groups.entries());
  }, [allPermissions]);

  const togglePermission = (name: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleModule = (perms: { name: string }[], checkAll: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => { checkAll ? next.add(p.name) : next.delete(p.name); });
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    const permissionNames = Array.from(selectedPermissions);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ name: values.name });
        await assignMutation.mutateAsync({ permissions: permissionNames });
        toast.success('Rôle mis à jour');
        router.push(`/roles/${role!.id}`);
      } else {
        const res = await createMutation.mutateAsync({ name: values.name, permissions: permissionNames });
        toast.success('Rôle créé');
        router.push(`/roles/${(res as any)?.data?.id}`);
      }
    } catch (err) {
      applyServerErrors(err, form, 'Erreur lors de l\'enregistrement du rôle');
    }
  };

  return (
    <PageContainer scrollable>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 w-full">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground"
                onClick={() => router.push('/roles')}>
                <ArrowLeft className="h-4 w-4" />Rôles
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-lg font-bold">{isEdit ? `Rôle : ${role!.name}` : 'Nouveau rôle'}</h1>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/roles')}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le rôle'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du rôle *</FormLabel>
                  <FormControl><Input placeholder="ex. gestionnaire-agence-casa" disabled={isSystemRole} {...field} /></FormControl>
                  {isSystemRole && <p className="text-xs text-muted-foreground">Ce rôle système ne peut pas être renommé.</p>}
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {groupedPermissions.map(([module, perms]) => {
                const allChecked = perms.every((p) => selectedPermissions.has(p.name));
                const someChecked = perms.some((p) => selectedPermissions.has(p.name));
                return (
                  <div key={module} className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <Checkbox
                        checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                        onCheckedChange={(checked) => toggleModule(perms, !!checked)}
                      />
                      <span className="text-sm font-semibold">{module}</span>
                      <Badge variant="outline" className="text-[10px]">{perms.filter((p) => selectedPermissions.has(p.name)).length}/{perms.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-1">
                      {perms.map((p) => (
                        <label key={p.name} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={selectedPermissions.has(p.name)} onCheckedChange={() => togglePermission(p.name)} />
                          <span>{p.label ?? p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {isEdit && <RoleUsersSection roleId={role!.id} />}
        </form>
      </Form>
    </PageContainer>
  );
}

function RoleUsersSection({ roleId }: { roleId: string }) {
  const { data: usersRes } = useRoleUsers(roleId);
  const roleUsers = usersRes?.data ?? [];
  const { data: allUsersRes } = useUsers({ per_page: 200 });
  const attachMutation = useAttachUserToRole(roleId);
  const detachMutation = useDetachUserFromRole(roleId);
  const [selectedUserId, setSelectedUserId] = useState('');

  const roleUserIds = new Set(roleUsers.map((u) => u.id));
  const availableUsers = (allUsersRes?.data ?? [])
    .filter((u) => !roleUserIds.has(u.id))
    .map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}`, sub: u.email }));

  const handleAdd = () => {
    if (!selectedUserId) return;
    attachMutation.mutate(selectedUserId, {
      onSuccess: () => { toast.success('Utilisateur ajouté au rôle'); setSelectedUserId(''); },
      onError: () => toast.error('Impossible d\'ajouter cet utilisateur'),
    });
  };

  const handleRemove = (userId: string) => {
    detachMutation.mutate(userId, {
      onSuccess: () => toast.success('Utilisateur retiré du rôle'),
      onError: () => toast.error('Impossible de retirer cet utilisateur'),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Utilisateurs ({roleUsers.length})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <SelectField value={selectedUserId} onChange={setSelectedUserId} placeholder="Sélectionner un utilisateur à ajouter" options={availableUsers} />
          </div>
          <Button type="button" variant="outline" className="gap-1.5" disabled={!selectedUserId || attachMutation.isPending} onClick={handleAdd}>
            {attachMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>

        <Separator />

        {roleUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur n'a ce rôle</p>
        ) : (
          <div className="space-y-2">
            {roleUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2.5 border rounded-lg text-sm">
                <div>
                  <div className="font-medium">{u.first_name} {u.last_name} {!u.is_active && <Badge variant="destructive" className="ml-1 text-[10px]">Suspendu</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{u.email}{u.agency ? ` · ${u.agency.name}` : ''}</div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50"
                  disabled={detachMutation.isPending}
                  onClick={() => handleRemove(u.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
