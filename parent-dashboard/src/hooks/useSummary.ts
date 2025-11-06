import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useSummary() {
  return useQuery({
    queryKey: ['topicSummaries'],
    queryFn: MockDataService.getTopicSummaries,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
