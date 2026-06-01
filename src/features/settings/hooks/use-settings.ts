import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingService } from '@/services/setting.service';
import type { GroupSettings } from '@/types/setting.types';

export const settingKeys = {
  all: ['settings'] as const,
  group: (group: string) => [...settingKeys.all, group] as const,
};

export function useAllSettings() {
  return useQuery({
    queryKey: settingKeys.all,
    queryFn: () => settingService.all(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSettingGroup(group: string) {
  return useQuery({
    queryKey: settingKeys.group(group),
    queryFn: () => settingService.group(group),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings(group: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GroupSettings) => settingService.update(group, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingKeys.all });
      qc.invalidateQueries({ queryKey: settingKeys.group(group) });
    },
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => settingService.uploadLogo(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingKeys.all }),
  });
}
