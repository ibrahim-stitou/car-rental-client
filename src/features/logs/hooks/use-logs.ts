import { useQuery } from '@tanstack/react-query';
import { logService } from '@/services/log.service';
import type { LogFilters } from '@/types/log.types';

export const logKeys = {
  all: ['logs'] as const,
  list: (filters?: LogFilters) => [...logKeys.all, 'list', filters] as const,
  detail: (id: string) => [...logKeys.all, 'detail', id] as const,
};

export function useLogs(filters?: LogFilters) {
  return useQuery({ queryKey: logKeys.list(filters), queryFn: () => logService.list(filters) });
}
export function useLog(id: string) {
  return useQuery({ queryKey: logKeys.detail(id), queryFn: () => logService.show(id), enabled: !!id });
}
