import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: api.getApps,
  });
}

export function useRegisterApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, pat, appName }: { appId: string; pat: string; appName?: string }) =>
      api.registerApp(appId, pat, appName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => api.deleteApp(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}
