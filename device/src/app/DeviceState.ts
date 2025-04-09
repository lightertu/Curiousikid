import { create } from 'zustand';
import { LiveKitConnectionDetails } from './api/livekit';
import { AgentState } from '@livekit/components-react';
import { BLANK_SCREEN } from './lib/pixel-gui/blank';

const TEST_USER_ID = process.env.NEXT_PUBLIC_USER_ID as string;

export enum ScreenMode {
  MAIN_MENU = 'MAIN_MENU',
  STORY_SELECTION_MENU = 'STORY_SELECTION_MENU',
  STORY_PLAYBACK = 'STORY_PLAYBACK',
  STORY_PLAYBACK_PROACTIVE_QUESTION_CONVERSATION = 'STORY_PLAYBACK_PROACTIVE_QUESTION_CONVERSATION',
  STORY_PLAYBACK_USER_QUESTION_CONVERSATION = 'STORY_PLAYBACK_USER_QUESTION_CONVERSATION',
  CHAT_CHARACTER_SELECTION_MENU = 'CHAT_CHARACTER_SELECTION_MENU',
  CHAT_CHARACTER_CONVERSATION = 'CHAT_CHARACTER_PLAYBACK',
}

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  artist: string;
  audioUrl: string;
  duration: number;
  thumbnailUrl: string;
  pixelArtCover: string[][];
}

export interface CurrentStory extends StoryMetadata {
  currentTime: number;
}

export interface ProactiveQuestionPoint {
  storyId: string;
  userId: string;
  id: string;
  interruptAt: number;
  question: string;
  connectAt: number;
}

export interface UserProactiveQuestionPoint {
  storyId: string;
  userId: string;
  interruptAt: number;
}

export interface ChatCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface DeviceState {
  // user state
  userId: string;
  setUserId: (userId: string) => void;

  // websocket state
  isWebSocketConnected: boolean;
  setIsWebSocketConnected: (isConnected: boolean) => void;

  // screen state
  screenMode: ScreenMode;
  setScreenMode: (screenMode: ScreenMode) => void;
  screen: string[][];
  setScreen: (screen: string[][]) => void;

  // livekit state  
  isConnectingToLivekit: boolean;
  setIsConnectingToLivekit: (isConnecting: boolean) => void;
  agentState: AgentState;
  setAgentState: (agentState: AgentState) => void;
  isLivekitRoomConnected: boolean;
  setIsLivekitRoomConnected: (isConnected: boolean) => void;
  livekitConnectionDetails: LiveKitConnectionDetails | null;
  setLivekitConnectionDetails: (details: LiveKitConnectionDetails | null) => void;

  // conversational story state
  currentStory: CurrentStory | null;
  setCurrentStory: (story: CurrentStory) => void;
  stories: StoryMetadata[];
  setStories: (stories: StoryMetadata[]) => void;
  isProactiveQuestionActive: boolean;
  setIsProactiveQuestionActive: (isActive: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  isUserQuestionActive: boolean;
  setIsUserQuestionActive: (isActive: boolean) => void;

  // chat character state
  characters: ChatCharacter[];
  setCharacters: (characters: ChatCharacter[]) => void;
  currentCharacter: ChatCharacter | null;
  setChatCharacter: (character: ChatCharacter) => void;
}

const useDeviceState = create<DeviceState>((set) => ({
  // user state
  userId: TEST_USER_ID,
  setUserId: (userId: string) => set({ userId }),

  // websocket state
  isWebSocketConnected: false,
  setIsWebSocketConnected: (isConnected: boolean) => set({ isWebSocketConnected: isConnected }),

  // screen state
  screenMode: ScreenMode.MAIN_MENU,
  setScreenMode: (screenMode: ScreenMode) => set({ screenMode }),
  screen: BLANK_SCREEN,
  setScreen: (screen: string[][]) => set({ screen }),

  // livekit state
  isConnectingToLivekit: false,
  setIsConnectingToLivekit: (isConnecting: boolean) => set({ isConnectingToLivekit: isConnecting }),
  agentState: "disconnected",
  setAgentState: (agentState: AgentState) => set({ agentState }),
  isLivekitRoomConnected: false,
  setIsLivekitRoomConnected: (isConnected: boolean) => set({ isLivekitRoomConnected: isConnected }),
  livekitConnectionDetails: null,
  setLivekitConnectionDetails: (details: LiveKitConnectionDetails | null) => set({ livekitConnectionDetails: details }),

  // conversational story state
  currentStory: null,
  setCurrentStory: (story: CurrentStory) => set({ currentStory: story }),
  stories: [],
  setStories: (stories: StoryMetadata[]) => set({ stories }),
  isProactiveQuestionActive: false,
  setIsProactiveQuestionActive: (isActive: boolean) => set({ isProactiveQuestionActive: isActive }),
  isPlaying: false,
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  isUserQuestionActive: false,
  setIsUserQuestionActive: (isActive: boolean) => set({ isUserQuestionActive: isActive }),

  // chat character state
  characters: [],
  setCharacters: (characters: ChatCharacter[]) => set({ characters }),
  currentCharacter: null,
  setChatCharacter: (character: ChatCharacter) => set({ currentCharacter: character }),
}));

export default useDeviceState;
