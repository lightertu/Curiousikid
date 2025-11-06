import type { ConversationSession } from './conversation.types';

export interface StoryInterruption {
  storyId: string;
  storyTitle: string;
  totalListeningTime: number; // seconds
  interruptionCount: number;
  sessions: ConversationSession[];
  engagementScore: number; // 0-100
}

export interface UsageStatistics {
  timeRange: 'day' | 'week' | 'month';
  totalListeningTime: number;
  uniqueStoriesCount: number;
  averageInterruptionsPerSession: number;
  topTopics: Array<{ topic: string; count: number }>;
  dailyUsage: Array<{ date: Date; minutes: number }>;
}
