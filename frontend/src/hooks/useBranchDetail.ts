import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useBranchDetail(appId: string, branchName: string | null) {
  return useQuery({
    queryKey: ['branchDetail', appId, branchName],
    queryFn: () => api.getBranchDetail(appId, branchName!),
    enabled: !!appId && !!branchName,
    staleTime: 60_000,
  });
}
