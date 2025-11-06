export interface Utterance {
  id: string;
  childSpeech: string;
  aiResponse: string;
  timestamp: Date;
  topicTags: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ConversationSession {
  id: string;
  storyTitle: string;
  characterName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  utterances: Utterance[];
  interruptionCount: number;
  storyTimestamp?: number; // position in story when interrupted
}

export interface TopicSummary {
  id: string;
  category: 'friends' | 'emotions' | 'characters' | 'learning' | 'curiosity';
  summary: string;
  storyTitle: string;
  timestamp: Date;
  utteranceIds: string[]; // references to source utterances
}

export interface HeadsUpAlert {
  id: string;
  category: 'death' | 'violence' | 'bullying' | 'fear' | 'sadness' | 'conflict' | 'curiosity' | 'learning' | 'emotions';
  summary: string;
  storyTitle: string;
  timestamp: Date;
  conversationSessionId: string;
  utteranceIds: string[];
  acknowledged: boolean;
}
