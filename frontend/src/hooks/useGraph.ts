import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useGraph(appId: string) {
  return useQuery({
    queryKey: ['graph', appId],
    queryFn: () => api.getGraph(appId),
    enabled: !!appId,
    staleTime: 60_000,
  });
}
