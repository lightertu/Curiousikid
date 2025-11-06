import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useStorySummaries() {
  return useQuery({
    queryKey: ['storySummaries'],
    queryFn: MockDataService.getStorySummaries,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
