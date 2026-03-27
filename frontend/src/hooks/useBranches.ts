import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useBranches(appId: string) {
  return useQuery({
    queryKey: ['branches', appId],
    queryFn: () => api.getBranches(appId),
    enabled: !!appId,
    staleTime: 60_000,
  });
}
