import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api.service';

export function useSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => api.triggerSync(appId),
    onSuccess: (_data, appId) => {
      // Invalidate all queries for this app after sync
      queryClient.invalidateQueries({ queryKey: ['branches', appId] });
      queryClient.invalidateQueries({ queryKey: ['graph', appId] });
      queryClient.invalidateQueries({ queryKey: ['mergeEvents', appId] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });
}
