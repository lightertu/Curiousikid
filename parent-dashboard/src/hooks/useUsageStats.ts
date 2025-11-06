import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useUsageStats() {
  return useQuery({
    queryKey: ['usageStats'],
    queryFn: MockDataService.getUsageStatistics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
