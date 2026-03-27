import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useMergeEvents(appId: string) {
  return useQuery({
    queryKey: ['mergeEvents', appId],
    queryFn: () => api.getMergeEvents(appId),
    enabled: !!appId,
    staleTime: 60_000,
  });
}
