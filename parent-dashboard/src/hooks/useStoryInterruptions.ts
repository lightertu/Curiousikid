import { useQuery } from '@tanstack/react-query';
import { MockDataService } from '../services/mockData.service';

export function useStoryInterruptions() {
  return useQuery({
    queryKey: ['storyInterruptions'],
    queryFn: MockDataService.getStoryInterruptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
