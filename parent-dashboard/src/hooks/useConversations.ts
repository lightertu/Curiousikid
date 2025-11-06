import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: MockDataService.getConversations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
