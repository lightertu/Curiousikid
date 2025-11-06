import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useHeadsUp() {
  return useQuery({
    queryKey: ['headsUpAlerts'],
    queryFn: MockDataService.getHeadsUpAlerts,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => MockDataService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headsUpAlerts'] });
    },
  });
}
