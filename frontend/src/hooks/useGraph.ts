import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.service';
import type { GraphQueryOptions } from '../types/graph.types';

export function useGraph(appId: string, options?: GraphQueryOptions) {
  return useQuery({
    queryKey: ['graph', appId, options?.since, options?.until, options?.limit, options?.activeSince],
    queryFn: () => api.getGraph(appId, options),
    enabled: !!appId,
    staleTime: 60_000,
    placeholderData: (prev) => prev, // keep previous data while loading new range
  });
}

export function useGraphSummary(appId: string) {
  return useQuery({
    queryKey: ['graphSummary', appId],
    queryFn: () => api.getGraphSummary(appId),
    enabled: !!appId,
    staleTime: 120_000,
  });
}
