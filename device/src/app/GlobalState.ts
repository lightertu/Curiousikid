import { create } from 'zustand';
import { JSONPath } from 'jsonpath-plus';
import { cloneDeep } from 'lodash';

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
  }
];

export interface DeviceState {
  isPlaying: boolean;
  stories: StoryMetadata[];
  currentStory: CurrentStory | null;
  libraryStatus: boolean;
  isChatActive: boolean;
  isAIVoiceStreaming: boolean;
  isAIVoicePlaying: boolean;
  currentConversationId: string | null;
  isWebSocketConnected: boolean;
  questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
  } | null;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStory: (currentStory: CurrentStory | null) => void;
  setStories: (stories: StoryMetadata[]) => void;
  setLibraryStatus: (libraryStatus: boolean) => void;
  setIsChatActive: (isChatActive: boolean) => void;
  setIsAIVoiceStreaming: (isAIVoiceStreaming: boolean) => void;
  setIsAIVoicePlaying: (isAIVoicePlaying: boolean) => void;
  setCurrentConversationId: (currentConversationId: string) => void;
  setIsWebSocketConnected: (isWebSocketConnected: boolean) => void;
  setQuestionPoint: (questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
  } | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSubtree: (jsonPath: string, newValue: any) => void;
}

const useGlobalState = create<DeviceState>((set) => ({
  isPlaying: false,
  stories: INIT_STORY_LIST,
  currentStory: {
    currentTime: 0,
    id: INIT_STORY_LIST[0].id,
    title: INIT_STORY_LIST[0].title,
    description: INIT_STORY_LIST[0].description,
    artist: INIT_STORY_LIST[0].artist,
    audioUrl: INIT_STORY_LIST[0].audioUrl,
    duration: INIT_STORY_LIST[0].duration,
    thumbnailUrl: INIT_STORY_LIST[0].thumbnailUrl,
  },
  questionPoint: null,
  libraryStatus: false,
  isChatActive: false,
  isAIVoiceStreaming: false,
  isAIVoicePlaying: false,
  currentConversationId: null,
  isWebSocketConnected: false,

  setIsPlaying: (isPlaying: boolean) => 
    useGlobalState.getState().updateSubtree("$.isPlaying", isPlaying),
          
  setCurrentStory: (currentStory: CurrentStory | null) => 
    useGlobalState.getState().updateSubtree("$.currentStory", currentStory),
    
  setStories: (stories: StoryMetadata[]) => 
    useGlobalState.getState().updateSubtree("$.stories", stories),
    
  setLibraryStatus: (libraryStatus: boolean) => 
    useGlobalState.getState().updateSubtree("$.libraryStatus", libraryStatus),
    
  setIsChatActive: (isChatActive: boolean) => 
    useGlobalState.getState().updateSubtree("$.isChatActive", isChatActive),
    
  setIsAIVoiceStreaming: (isAIVoiceStreaming: boolean) => 
    useGlobalState.getState().updateSubtree("$.isAIVoiceStreaming", isAIVoiceStreaming),
    
  setIsAIVoicePlaying: (isAIVoicePlaying: boolean) => 
    useGlobalState.getState().updateSubtree("$.isAIVoicePlaying", isAIVoicePlaying),
    
  setCurrentConversationId: (currentConversationId: string) => 
    useGlobalState.getState().updateSubtree("$.currentConversationId", currentConversationId),
    
  setIsWebSocketConnected: (isWebSocketConnected: boolean) => 
    useGlobalState.getState().updateSubtree("$.isWebSocketConnected", isWebSocketConnected),

  setQuestionPoint: (questionPoint: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
  } | null) => useGlobalState.getState().updateSubtree("$.questionPoint", questionPoint),
  
  updateSubtree: (
    jsonPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue: any
  ) => {
    set((prevState) => {
      const clonedState = cloneDeep(prevState);
  
      const matches = JSONPath({
        path: jsonPath,
        json: clonedState,
        resultType: 'all',
      });
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matches.forEach((match: any) => {
        match.parent[match.parentProperty] = newValue;
      });
  
      return clonedState;
    }, false);
  },
}));

export default useGlobalState;
