import { create } from 'zustand';
import { JSONPath } from 'jsonpath-plus';
import { cloneDeep } from 'lodash';
import { LiveKitConnectionDetails } from './api/livekit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UpdateCallback<T = any> = (jsonPath: string, newValue: T, previousValue?: T) => void;
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const NoOpsCallback: UpdateCallback = (jsonPath: string, newValue: any) => {};

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  artist: string;
  audioUrl: string;
  duration: number;
  thumbnailUrl: string;
}

export interface CurrentStory extends StoryMetadata {
  currentTime: number;
}

const INIT_STORY_LIST: StoryMetadata[] = [
  {
    id: "1",
    title: "Birdy on the Ski Slopes",
    description: "A journey through the magical forest begins with a single step.",
    audioUrl: "/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
    duration: 180.5,
    artist: "Storynory",
    thumbnailUrl: "https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?",
  },
  {
    id: "2",
    title: "The Deep Blue Discovery",
    description: "Something cool",
    artist: "Storynory",
    audioUrl: "/The_Deep_Blue_Discovery_story.mp3",
    duration: 856.842449,
    thumbnailUrl: "https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?",
  },
];

export interface DeviceState {
  isPlaying: boolean;
  stories: StoryMetadata[];
  currentStory: CurrentStory | null;
  libraryStatus: boolean;
  currentConversationId: string;
  isWebSocketConnected: boolean;
  questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
    connectAt: number;
  } | null;
  isConnectingToLivekit: boolean;
  livekitConnectionDetails: LiveKitConnectionDetails | null;
  isLivekitRoomConnected: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStory: (currentStory: CurrentStory | null) => void;
  setStories: (stories: StoryMetadata[]) => void;
  setLibraryStatus: (libraryStatus: boolean) => void;
  setCurrentConversationId: (currentConversationId: string) => void;
  setIsWebSocketConnected: (isWebSocketConnected: boolean) => void;
  setQuestionPoint: (questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
    connectAt: number;
  } | null) => void;
  setIsConnectingToLivekit: (isConnectingToLivekit: boolean) => void;
  setLivekitConnectionDetails: (livekitConnectionDetails: LiveKitConnectionDetails | null) => void;
  setIsLivekitRoomConnected: (isConnected: boolean) => void;
  playAudio: () => void;
  pauseAudio: () => void;
  togglePlayPause: () => void;
}

const INIT_STORY_ID = 1;
const useGlobalState = create<DeviceState>((set) => ({
  isPlaying: false,
  stories: INIT_STORY_LIST,
  livekitConnectionDetails: null,
  isConnectingToLivekit: false,
  isLivekitRoomConnected: false,
  currentStory: {
    currentTime: 0,
    id: INIT_STORY_LIST[INIT_STORY_ID].id,
    title: INIT_STORY_LIST[INIT_STORY_ID].title,
    description: INIT_STORY_LIST[INIT_STORY_ID].description,
    artist: INIT_STORY_LIST[INIT_STORY_ID].artist,
    audioUrl: INIT_STORY_LIST[INIT_STORY_ID].audioUrl,
    duration: INIT_STORY_LIST[INIT_STORY_ID].duration,
    thumbnailUrl: INIT_STORY_LIST[INIT_STORY_ID].thumbnailUrl,
  },
  questionPoint: null,
  libraryStatus: false,
  currentConversationId: '',
  isWebSocketConnected: false,

  setIsPlaying: (isPlaying: boolean) => 
    set({ isPlaying }),
          
  setCurrentStory: (currentStory: CurrentStory | null) => 
    set({ currentStory }),
    
  setStories: (stories: StoryMetadata[]) => 
    set({ stories }),
    
  setLibraryStatus: (libraryStatus: boolean) => 
    set({ libraryStatus }),
    
  setCurrentConversationId: (currentConversationId: string) => 
    set({ currentConversationId }),
    
  setIsWebSocketConnected: (isWebSocketConnected: boolean) => 
    set({ isWebSocketConnected }),

  setQuestionPoint: (questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
  } | null) => set({ questionPoint }),

  setIsConnectingToLivekit: (isConnectingToLivekit: boolean) => 
    set({ isConnectingToLivekit }),

  setLivekitConnectionDetails: (livekitConnectionDetails: LiveKitConnectionDetails | null) => 
    set({ livekitConnectionDetails }),

  setIsLivekitRoomConnected: (isLivekitRoomConnected: boolean) => 
    set({ isLivekitRoomConnected }),
  
  playAudio: () => set((state) => ({ isPlaying: true })),
  
  pauseAudio: () => set((state) => ({ isPlaying: false })),
  
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));

export default useGlobalState;
