import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.service';
import type { ProviderType } from '../types/app.types';

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: api.getApps,
  });
}

export function useRegisterApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appId,
      pat,
      providerType = 'mendix',
      appName,
      repoUrl,
    }: {
      appId: string;
      pat: string;
      providerType?: ProviderType;
      appName?: string;
      repoUrl?: string;
    }) => api.registerApp(appId, pat, providerType, appName, repoUrl),
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
