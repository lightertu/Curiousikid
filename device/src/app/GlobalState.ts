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
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStory: (currentStory: CurrentStory | null) => void;
  setStories: (stories: StoryMetadata[]) => void;
  libraryStatus: boolean;
  setLibraryStatus: (libraryStatus: boolean) => void;
  isChatActive: boolean;
  setIsChatActive: (isChatActive: boolean) => void;
  isAIVoiceStreaming: boolean;
  setIsAIVoiceStreaming: (isAIVoiceStreaming: boolean) => void;
  isAIVoicePlaying: boolean;
  setIsAIVoicePlaying: (isAIVoicePlaying: boolean) => void;
  currentConversationId: string | null;
  setCurrentConversationId: (currentConversationId: string) => void;
  isWebSocketConnected: boolean;
  setIsWebSocketConnected: (isWebSocketConnected: boolean) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSubtree: (jsonPath: string, newValue: any, callback: UpdateCallback) => void;
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
  libraryStatus: false,
  isChatActive: false,
  isAIVoiceStreaming: false,
  isAIVoicePlaying: false,
  currentConversationId: null,
  isWebSocketConnected: false,

  setIsPlaying: (isPlaying: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.isPlaying", 
      isPlaying, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.isPlaying", isPlaying)
    ),
    
  setCurrentStory: (currentStory: CurrentStory | null, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.currentStory", 
      currentStory, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.currentStory", currentStory)
    ),
    
  setStories: (stories: StoryMetadata[], callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.stories", 
      stories, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.stories", stories)
    ),
    
  setLibraryStatus: (libraryStatus: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.libraryStatus", 
      libraryStatus, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.libraryStatus", libraryStatus)
    ),
    
  setIsChatActive: (isChatActive: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.isChatActive", 
      isChatActive, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.isChatActive", isChatActive)
    ),
    
  setIsAIVoiceStreaming: (isAIVoiceStreaming: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.isAIVoiceStreaming", 
      isAIVoiceStreaming, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.isAIVoiceStreaming", isAIVoiceStreaming)
    ),
    
  setIsAIVoicePlaying: (isAIVoicePlaying: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.isAIVoicePlaying", 
      isAIVoicePlaying, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.isAIVoicePlaying", isAIVoicePlaying)
    ),
    
  setCurrentConversationId: (currentConversationId: string, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.currentConversationId", 
      currentConversationId, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.currentConversationId", currentConversationId)
    ),
    
  setIsWebSocketConnected: (isWebSocketConnected: boolean, callback: UpdateCallback = NoOpsCallback) => 
    useGlobalState.getState().updateSubtree("$.isWebSocketConnected", 
      isWebSocketConnected, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (x, y) => callback("$.isWebSocketConnected", isWebSocketConnected)
    ),

  updateSubtree: (
    jsonPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue: any,
    callback: UpdateCallback = NoOpsCallback
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
  
    // Now that set has been invoked, optionally call your callback:
    if (callback) {
      callback(jsonPath, newValue);
    }
  },
}));

export default useGlobalState;
