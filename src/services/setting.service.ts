import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse } from '@/types/api.types';
import type { AllSettings, GroupSettings } from '@/types/setting.types';

export const settingService = {
  all: () =>
    apiClient.get<ApiResponse<AllSettings>>(apiRoutes.settings.all).then((r) => r.data),

  group: (group: string) =>
    apiClient.get<ApiResponse<GroupSettings>>(apiRoutes.settings.group(group)).then((r) => r.data),

  update: (group: string, data: GroupSettings) =>
    apiClient
      .put<ApiResponse<GroupSettings>>(apiRoutes.settings.updateGroup(group), data)
      .then((r) => r.data),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return apiClient
      .post<ApiResponse<{ url: string }>>(apiRoutes.settings.uploadLogo, form)
      .then((r) => r.data);
  },

  uploadHeroImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient
      .post<ApiResponse<{ url: string }>>(apiRoutes.settings.uploadHeroImage, form)
      .then((r) => r.data);
  },
};
