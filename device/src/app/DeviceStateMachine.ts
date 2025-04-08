import { createMachine, assign, MachineContext } from 'xstate';
import { create } from 'zustand';
import { JSONPath } from 'jsonpath-plus';
import { cloneDeep, set } from 'lodash';
import { LiveKitConnectionDetails } from './api/livekit';
import { AgentState } from '@livekit/components-react';
import { BLANK_SCREEN } from './lib/pixel-gui/blank';

const TEST_USER_ID = process.env.NEXT_PUBLIC_USER_ID as string;

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

export interface DeviceContext extends MachineContext {
    // user state
    userId: string;
    frame: number;
    topMenuSelectedIndex: number;
    topMenuSelection: string[];

    // websocket state
    isWebSocketConnected: boolean;

    // screen state
    screen: string[][];
    topMenuHighlightedIndex: number;

    // livekit state  
    isConnectingToLivekit: boolean;
    agentState: AgentState;
    isLivekitRoomConnected: boolean;
    livekitConnectionDetails: LiveKitConnectionDetails | null;

    // conversational story state
    currentStory: CurrentStory | null;
    stories: StoryMetadata[];
    isProactiveQuestionActive: boolean;
    isStoryPlaying: boolean;
    isUserQuestionActive: boolean;
    selectedStoryIndex: number;
    selectedAIIndex: number;

    // chat character state
    characters: ChatCharacter[];
    currentCharacter: ChatCharacter | null;
    selectedCharacterIndex: number;
}

export enum DeviceEventType {
    ESC_PRESSED = 'ESC_PRESSED',
    ESC_LONG_PRESSED = 'ESC_LONG_PRESSED',
    ENTER_PRESSED = 'ENTER_PRESSED',
    LEFT_PRESSED = 'LEFT_PRESSED',
    RIGHT_PRESSED = 'RIGHT_PRESSED',
    SPACE_PRESSED = 'SPACE_PRESSED'
}

export type DeviceEvent =
    | { type: DeviceEventType.ESC_PRESSED }
    | { type: DeviceEventType.ESC_LONG_PRESSED }
    | { type: DeviceEventType.ENTER_PRESSED }
    | { type: DeviceEventType.LEFT_PRESSED }
    | { type: DeviceEventType.RIGHT_PRESSED }
    | { type: DeviceEventType.SPACE_PRESSED }
// Additional actions: e.g. { type: 'STORY_FINISHED' } from audio end event
// or { type: 'AI_RESPONSE', payload: string }

export const deviceMachine = createMachine(
    {
        id: 'device',
        initial: 'mainMenu',
        context: {
            // user state
            userId: TEST_USER_ID,
            topMenuSelectedIndex: 0,
            isWebSocketConnected: false,

            // screen state
            topMenuHighlightedIndex: 0,
            topMenuSelection: ["Stories", "Chat"],
            frame: 0,
            screen: BLANK_SCREEN,

            // livekit state
            isConnectingToLivekit: false,
            agentState: 'disconnected',
            isLivekitRoomConnected: false,
            livekitConnectionDetails: null,

            // conversational story state
            currentStory: null,
            stories: [],
            isProactiveQuestionActive: false,
            isStoryPlaying: false,
            isUserQuestionActive: false,
            selectedStoryIndex: 0,
            selectedAIIndex: 0,

            // chat character state
            characters: [],
            currentCharacter: null,
            selectedCharacterIndex: 0,
        } as DeviceContext,
        states: {
            mainMenu: {
                on: {
                    LEFT: {
                        actions: ['moveTopMenuSelectionLeft'],
                    },
                    RIGHT: {
                        actions: ['moveTopMenuSelectionRight'],
                    },
                    ENTER: [
                        { guard: 'isStoriesSelected', target: 'storiesSelection' },
                        { guard: 'isChatSelected', target: 'chatSelection' },
                    ],
                },
            },
            storiesSelection: {
                on: {
                    LEFT: { actions: ['prevStory'] },
                    RIGHT: { actions: ['nextStory'] },
                    ENTER: { target: 'storyPlayback' },
                    ESC: { target: 'mainMenu' },
                },
            },

            storyPlayback: {
                entry: assign({
                    isStoryPlaying: (ctx) => true,
                    currentStory: (ctx) => {
                        const story = ctx.context.stories[ctx.context.selectedStoryIndex];
                        return {
                            ...story,
                            currentTime: 0,
                        };
                    }
                }),
                on: {
                    SPACE: { actions: ['togglePause'] },
                    STORY_ENDED: { target: 'storiesSelection', actions: ['stopStory'] },
                    ESC: { target: 'storiesSelection', actions: ['stopStory'] },
                },
            },

            chatSelection: {
                on: {
                    LEFT: { actions: ['prevAI'] },
                    RIGHT: { actions: ['nextAI'] },
                    ENTER: { target: 'chatActive' },
                    ESC: { target: 'mainMenu' },
                },
            },

            chatActive: {
                on: {
                    ESC: { target: 'chatSelection' },
                    // Possibly handle SPACE for toggling mic, etc.
                },
            },
        },
        on: {
            TICK: {
                // global event for animation
                actions: assign({
                    frame: (ctx) => ctx.context.frame + 1,
                }),
            },
        },
    },
    {
        actions: {
            // High-level example implementations
            moveTopMenuSelectionLeft: assign({
                topMenuHighlightedIndex: (ctx) => {
                    const len = ctx.context.topMenuSelection.length;
                    return Math.max(0, (ctx.context.topMenuHighlightedIndex - 1 + len) % len);
                }
            }),
            moveTopMenuSelectionRight: assign({
                topMenuHighlightedIndex: (ctx) => {
                    const len = ctx.context.topMenuSelection.length;
                    return Math.max(0, (ctx.context.topMenuHighlightedIndex + 1) % len);
                }
            }),
            isStoriesSelected: (ctx) => ctx.context.topMenuHighlightedIndex === 0,

            isChatSelected: (ctx) => ctx.context.topMenuHighlightedIndex === 1,

            prevStory: assign({
                selectedStoryIndex: (ctx) => {
                    const len = ctx.context.stories.length;
                    return Math.max(0, (ctx.context.selectedStoryIndex - 1 + len) % len);
                }
            }),
            nextStory: assign({
                selectedStoryIndex: (ctx) => {
                    const len = ctx.context.stories.length;
                    return Math.max(0, (ctx.context.selectedStoryIndex + 1) % len);
                }
            }),

            stopStory: assign({
                isStoryPlaying: (_ctx) => false,
            }),

            togglePause: assign({
                isStoryPlaying: (ctx) => !ctx.context.isStoryPlaying,
            }),

            prevAI: assign({
                selectedAIIndex: (ctx) => {
                    const len = ctx.context.characters.length;
                    return Math.max(0, (ctx.context.selectedAIIndex - 1 + len) % len);
                }
            }),

            nextAI: assign({
                selectedAIIndex: (ctx) => {
                    const len = ctx.context.characters.length;
                    return Math.max(0, (ctx.context.selectedAIIndex + 1) % len);
                }
            }),
        },
        guards: {
            isStoriesSelected: (ctx) => ctx.context.topMenuHighlightedIndex === 0,
            isChatSelected: (ctx) => ctx.context.topMenuHighlightedIndex === 1,
        },
    }
);