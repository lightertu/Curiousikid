import type { ConversationSession, HeadsUpAlert, TopicSummary, Utterance } from '../types/conversation.types';
import type { StoryInterruption, UsageStatistics } from '../types/analytics.types';

// Helper to generate dates in the past
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Mock utterances
const createUtterance = (
  id: string,
  childSpeech: string,
  aiResponse: string,
  daysBack: number,
  topicTags: string[]
): Utterance => ({
  id,
  childSpeech,
  aiResponse,
  timestamp: daysAgo(daysBack),
  topicTags,
  sentiment: 'positive',
});

// Mock conversation sessions - Based on the two podcasts
const mockSessions: ConversationSession[] = [
  // Session 1: But Why - Robots (Recent)
  {
    id: 'session-1',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    characterName: 'Melody (But Why Host)',
    startTime: daysAgo(0),
    endTime: new Date(daysAgo(0).getTime() + 1800000), // 30 min later
    duration: 1800,
    interruptionCount: 5,
    utterances: [
      createUtterance(
        'u1',
        'Are robots alive?',
        'That\'s a great question! No, robots are not alive. They don\'t breathe, eat, or reproduce like living things do. Robots are machines that humans build and program to do specific tasks. They\'re really smart machines, but they\'re not alive like you and me!',
        0,
        ['robots', 'science', 'learning']
      ),
      createUtterance(
        'u2',
        'Why are robots made of metal?',
        'Robots are often made of metal because metal is strong and durable! It can handle doing the same movements over and over without breaking. Some robots also have plastic parts or other materials. Engineers choose materials based on what job the robot needs to do.',
        0,
        ['robots', 'engineering', 'materials']
      ),
      createUtterance(
        'u3',
        'Can I build my own robot?',
        'Absolutely! There are lots of robot kits designed for kids. You can start with simple robots that follow lines or avoid obstacles. As you learn more about programming and engineering, you can build more complex robots. Many engineers who work with robots today started by building simple ones when they were kids!',
        0,
        ['robots', 'learning', 'creativity']
      ),
      createUtterance(
        'u4',
        'Do robots have feelings?',
        'Robots don\'t have real feelings like humans do. They can be programmed to seem like they have feelings - like a robot that smiles or says nice things - but they don\'t actually feel happy or sad. Only living things with brains like ours can have real emotions.',
        0,
        ['robots', 'emotions', 'science']
      ),
      createUtterance(
        'u5',
        'What do robots do at the factory?',
        'At the GlobalFoundries factory we visited, robots help make microchips - those are tiny computer brains that go in phones, computers, and lots of devices you use! The robots move materials around, help with precise measurements, and do repetitive tasks so humans can focus on more creative work. Robots and humans work together as a team!',
        0,
        ['robots', 'work', 'technology']
      ),
    ],
  },
  // Session 2: Ancient Olympics (1 day ago)
  {
    id: 'session-2',
    storyTitle: 'Greeking Out: Ancient Olympics Part Deux',
    characterName: 'The Greeking Out Team',
    startTime: daysAgo(1),
    endTime: new Date(daysAgo(1).getTime() + 1500000), // 25 min later
    duration: 1500,
    interruptionCount: 4,
    utterances: [
      createUtterance(
        'u6',
        'Did girls get to compete in the Olympics?',
        'That\'s an important question! In ancient Greece, women weren\'t allowed to compete in the main Olympic Games. But there was a separate festival called the Heraia, which was a running competition just for unmarried women! It was held in honor of the goddess Hera. Today, of course, women compete in all Olympic events!',
        1,
        ['olympics', 'history', 'equality']
      ),
      createUtterance(
        'u7',
        'What sports did they have?',
        'The ancient Olympics had some sports we still have today, like running, wrestling, and javelin throwing! They also had chariot racing, which was super exciting. One unique event was the pankration - a mix of boxing and wrestling with very few rules. Athletes competed naked and covered in olive oil!',
        1,
        ['olympics', 'sports', 'history']
      ),
      createUtterance(
        'u8',
        'Why did they compete naked?',
        'Great question! The ancient Greeks believed the human body was beautiful and something to celebrate. Competing naked showed off the athletes\' strength and fitness. It was also practical - no clothes meant nothing to grab onto during wrestling! The word "gymnasium" actually comes from the Greek word "gymnos" which means naked.',
        1,
        ['olympics', 'culture', 'history']
      ),
      createUtterance(
        'u9',
        'Did they get medals like today?',
        'Instead of gold, silver, and bronze medals, ancient Olympic winners received an olive wreath - a crown made from olive branches! This was a huge honor. Winners also became famous heroes in their home cities and sometimes got free meals for life. The olive wreath was more valuable to them than any medal!',
        1,
        ['olympics', 'prizes', 'history']
      ),
    ],
  },
  // Session 3: But Why - Robots (2 days ago)
  {
    id: 'session-3',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    characterName: 'Melody (But Why Host)',
    startTime: daysAgo(2),
    endTime: new Date(daysAgo(2).getTime() + 1200000), // 20 min later
    duration: 1200,
    interruptionCount: 3,
    utterances: [
      createUtterance(
        'u10',
        'Who decides what robots look like?',
        'Engineers and designers decide what robots look like! They think about what job the robot needs to do. A robot that works in a factory might look very different from a robot that helps in a hospital. Some robots look like humans or animals, while others look like machines. The design depends on the robot\'s purpose!',
        2,
        ['robots', 'design', 'engineering']
      ),
      createUtterance(
        'u11',
        'Why do some robots look like people?',
        'Some robots are designed to look like people because they work closely with humans and it makes people more comfortable. These are called humanoid robots. If a robot is going to help in a hospital or teach in a classroom, having a friendly face and human-like movements can make people feel more at ease.',
        2,
        ['robots', 'design', 'psychology']
      ),
      createUtterance(
        'u12',
        'Can robots see me?',
        'Many robots have cameras and sensors that let them "see" their environment! They use these to avoid bumping into things and to recognize objects. Some robots can even recognize faces. But they don\'t see the way you do - they process images using computer programs. It\'s more like they\'re taking pictures and analyzing them really fast!',
        2,
        ['robots', 'technology', 'sensors']
      ),
    ],
  },
  // Session 4: Ancient Olympics (3 days ago)
  {
    id: 'session-4',
    storyTitle: 'Greeking Out: Ancient Olympics Part Deux',
    characterName: 'The Greeking Out Team',
    startTime: daysAgo(3),
    endTime: new Date(daysAgo(3).getTime() + 1400000), // 23 min later
    duration: 1400,
    interruptionCount: 3,
    utterances: [
      createUtterance(
        'u13',
        'Were the ancient Olympics like the ones today?',
        'They were similar in some ways but very different in others! Both celebrate athletic excellence and bring people together. But ancient Olympics only had men competing, lasted for 5 days, and were held to honor Zeus. Today\'s Olympics include athletes of all genders from around the world, have many more sports, and last about two weeks!',
        3,
        ['olympics', 'comparison', 'history']
      ),
      createUtterance(
        'u14',
        'Did they have teams or compete alone?',
        'Most ancient Olympic events were individual competitions - one athlete against another. But they did have team chariot racing! Four horses would pull a chariot with a driver, and it was incredibly exciting and dangerous. Cities would sponsor these teams, kind of like how countries have teams today.',
        3,
        ['olympics', 'sports', 'teamwork']
      ),
      createUtterance(
        'u15',
        'What was the coolest event?',
        'Many people thought chariot racing was the most exciting! Imagine four powerful horses racing around a track at top speed, with chariots crashing and drivers trying to win. The pankration was also amazing - it was like ancient mixed martial arts. Athletes could use almost any move except biting and eye-gouging!',
        3,
        ['olympics', 'sports', 'excitement']
      ),
    ],
  },
];

// Mock Heads Up Alerts - Mix of positive and concerning
const mockHeadsUpAlerts: HeadsUpAlert[] = [
  {
    id: 'alert-1',
    category: 'curiosity',
    summary: '🌟 Showed strong interest in engineering and building robots',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    timestamp: daysAgo(0),
    conversationSessionId: 'session-1',
    utteranceIds: ['u3'],
    acknowledged: false,
  },
  {
    id: 'alert-2',
    category: 'learning',
    summary: '📚 Asked thoughtful questions about gender equality in ancient sports',
    storyTitle: 'Greeking Out: Ancient Olympics Part Deux',
    timestamp: daysAgo(1),
    conversationSessionId: 'session-2',
    utteranceIds: ['u6'],
    acknowledged: false,
  },
  {
    id: 'alert-3',
    category: 'emotions',
    summary: '💭 Curious about whether robots have feelings - good opportunity to discuss emotions',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    timestamp: daysAgo(0),
    conversationSessionId: 'session-1',
    utteranceIds: ['u4'],
    acknowledged: true,
  },
];

// Story-level summaries
export interface StorySummary {
  storyId: string;
  storyTitle: string;
  storyUrl: string;
  totalSessions: number;
  totalInterruptions: number;
  overallSummary: string;
  keyThemes: string[];
  lastListened: Date;
}

const mockStorySummaries: StorySummary[] = [
  {
    storyId: 'story-1',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    storyUrl: 'https://www.vermontpublic.org/podcast/but-why-a-podcast-for-curious-kids/2024-12-13/who-decides-what-robots-look-like',
    totalSessions: 2,
    totalInterruptions: 8,
    overallSummary: 'Your child is fascinated by robots! They asked thoughtful questions about how robots work, what they\'re made of, and whether they\'re alive. They showed particular interest in building their own robot and understanding the difference between robots and living things. Great curiosity about engineering and technology!',
    keyThemes: ['Engineering & Design', 'Technology', 'Science', 'Creativity'],
    lastListened: daysAgo(0),
  },
  {
    storyId: 'story-2',
    storyTitle: 'Greeking Out: Ancient Olympics Part Deux',
    storyUrl: 'https://www.audacy.com/podcast/greeking-out-from-national-geographic-kids-cda30/episodes/s10e10-ancient-olympics-part-deux-67987',
    totalSessions: 2,
    totalInterruptions: 7,
    overallSummary: 'Your child is learning about ancient history and asking great questions! They were particularly interested in how the ancient Olympics compared to today, including questions about gender equality and different sports. They showed curiosity about cultural differences and historical context.',
    keyThemes: ['History', 'Sports', 'Culture', 'Equality'],
    lastListened: daysAgo(1),
  },
];

// Mock Story Interruptions
const mockStoryInterruptions: StoryInterruption[] = [
  {
    storyId: 'story-1',
    storyTitle: 'But Why: Who Decides What Robots Look Like?',
    totalListeningTime: 3000,
    interruptionCount: 8,
    sessions: mockSessions.filter(s => s.storyTitle === 'But Why: Who Decides What Robots Look Like?'),
    engagementScore: 92,
  },
  {
    storyId: 'story-2',
    storyTitle: 'Greeking Out: Ancient Olympics Part Deux',
    totalListeningTime: 2900,
    interruptionCount: 7,
    sessions: mockSessions.filter(s => s.storyTitle === 'Greeking Out: Ancient Olympics Part Deux'),
    engagementScore: 88,
  },
];

// Mock Usage Statistics
const mockUsageStats: UsageStatistics = {
  timeRange: 'week',
  totalListeningTime: 5900, // seconds
  uniqueStoriesCount: 2,
  averageInterruptionsPerSession: 3.75,
  topTopics: [
    { topic: 'Robots & Technology', count: 8 },
    { topic: 'Ancient History', count: 7 },
    { topic: 'Science & Engineering', count: 6 },
    { topic: 'Sports & Culture', count: 5 },
  ],
  dailyUsage: [
    { date: daysAgo(6), minutes: 0 },
    { date: daysAgo(5), minutes: 0 },
    { date: daysAgo(4), minutes: 0 },
    { date: daysAgo(3), minutes: 23 },
    { date: daysAgo(2), minutes: 20 },
    { date: daysAgo(1), minutes: 25 },
    { date: daysAgo(0), minutes: 30 },
  ],
};

// Export mock data service
export const MockDataService = {
  getConversations: (): Promise<ConversationSession[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSessions), 300);
    });
  },

  getHeadsUpAlerts: (): Promise<HeadsUpAlert[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockHeadsUpAlerts), 200);
    });
  },

  getStorySummaries: (): Promise<StorySummary[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStorySummaries), 250);
    });
  },

  getStoryInterruptions: (): Promise<StoryInterruption[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStoryInterruptions), 300);
    });
  },

  getUsageStatistics: (): Promise<UsageStatistics> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUsageStats), 250);
    });
  },

  acknowledgeAlert: (alertId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const alert = mockHeadsUpAlerts.find(a => a.id === alertId);
        if (alert) {
          alert.acknowledged = true;
        }
        resolve();
      }, 200);
    });
  },
};
