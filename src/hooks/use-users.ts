'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUserStore } from '@/stores/user-store';

export const useUsers = (page: number, search: string) => {
  //@ts-ignore
  const { setUsers, setPagination } = useUserStore();

  return useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/admin/users`, {
        params: { page, search },
      });
      return response.data;
    },
    //@ts-ignore
    onSuccess: (data) => {
      setUsers(data.data);
      setPagination({
        current_page: data.current_page,
        per_page: data.per_page,
        total: data.total,
        last_page: data.last_page,
      });
    },
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { removeUser } = useUserStore();

  return useMutation({
    mutationFn: (id: number) =>
      axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/admin/users/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      removeUser(id);
    },
  });
};