import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Client, CreateClientInput, UpdateClientInput, ClientFilters } from '@/types/client.types';

export const clientService = {
  list: (filters?: ClientFilters) =>
    apiClient.get<PaginatedResponse<Client>>(apiRoutes.clients.list, { params: filters }).then((r) => r.data),
  show: (id: string) =>
    apiClient.get<ApiResponse<Client>>(apiRoutes.clients.show(id)).then((r) => r.data),
  create: (input: CreateClientInput) =>
    apiClient.post<ApiResponse<Client>>(apiRoutes.clients.create, input).then((r) => r.data),
  update: (id: string, input: UpdateClientInput) =>
    apiClient.put<ApiResponse<Client>>(apiRoutes.clients.update(id), input).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.clients.delete(id)).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post<ApiResponse<Client>>(apiRoutes.clients.restore(id)).then((r) => r.data),
    uploadIdDocument(clientId: string, file: File, side: 'recto' | 'verso') {
      const formData = new FormData();
      formData.append('id_document', file);
      formData.append('side', side);
      return apiClient.post(`/clients/${clientId}/id-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    uploadDrivingLicense(clientId: string, file: File, side: 'recto' | 'verso') {
      const formData = new FormData();
      formData.append('driving_license', file);
      formData.append('side', side);
      return apiClient.post(`/clients/${clientId}/driving-license`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  uploadSelfie: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('selfie', file);
    return apiClient.post<ApiResponse<{ url: string }>>(apiRoutes.clientsExt.uploadSelfie(id), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  deleteMedia: (id: string, mediaId: number) =>
    apiClient.delete<ApiResponse<null>>(apiRoutes.clientsExt.deleteMedia(id, mediaId)).then((r) => r.data),
};
