import { createMachine, assign, MachineContext } from 'xstate';
import { create } from 'zustand';
import { JSONPath } from 'jsonpath-plus';
import { cloneDeep, set } from 'lodash';
import { LiveKitConnectionDetails } from './api/livekit';
import { AgentState } from '@livekit/components-react';
import { BLANK_SCREEN } from './lib/pixel-gui/blank';
import { renderTopMenu } from './PixelGuiRenderer';

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
                // Render the screen when entering this state
                entry: ['renderTopMenuScreen'],
                on: {
                    LEFT_PRESSED: [
                        // If at leftmost, go to blink state
                        { guard: 'isAtLeftmost', target: 'mainMenuBlinkingLeft' },
                        // Otherwise, update index and re-enter mainMenu to trigger screen render
                        { actions: ['moveTopMenuSelectionLeft'], target: 'mainMenu' }
                    ],
                    RIGHT_PRESSED: [
                        // If at rightmost, go to blink state
                        { guard: 'isAtRightmost', target: 'mainMenuBlinkingRight' },
                        // Otherwise, update index and re-enter mainMenu to trigger screen render
                        { actions: ['moveTopMenuSelectionRight'], target: 'mainMenu' }
                    ],
                    ENTER_PRESSED: [
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
            // Temporary state to show blank screen during left blink
            mainMenuBlinkingLeft: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: {
                    50: { target: 'mainMenu' } // After 50ms, go back to mainMenu
                }
            },
            // Temporary state to show blank screen during right blink
            mainMenuBlinkingRight: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: {
                    50: { target: 'mainMenu' } // After 50ms, go back to mainMenu
                }
            }
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
                topMenuHighlightedIndex: (ctx, event) => {
                    console.log("moveTopMenuSelectionLeft Before", ctx.context.topMenuHighlightedIndex);
                    const newIndex = ctx.context.topMenuHighlightedIndex - 1;
                    console.log("moveTopMenuSelectionLeft After", newIndex);
                    if (newIndex < 0) {
                        return 0;
                    } else {
                        return newIndex;
                    }
                },
            }),
            moveTopMenuSelectionRight: assign({
                topMenuHighlightedIndex: (ctx, event) => {
                    console.log("moveTopMenuSelectionRight Before", ctx.context.topMenuHighlightedIndex);
                    const newIndex = ctx.context.topMenuHighlightedIndex + 1;
                    console.log("moveTopMenuSelectionRight After", newIndex);
                    if (newIndex > 1) {
                        return 1;
                    } else {
                        return newIndex;
                    }
                },
            }),

            // Renamed action to specifically render the top menu screen
            renderTopMenuScreen: assign({
                screen: (ctx, event) => {
                    console.log("renderTopMenu Screen", ctx.context.topMenuHighlightedIndex);
                    // Pass the context directly now
                    return renderTopMenu(ctx.context);
                }
            }),

            isStoriesSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 0,

            isChatSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 1,

            prevStory: assign({
                selectedStoryIndex: (ctx, event) => {
                    const len = ctx.context.stories.length;
                    return Math.max(0, (ctx.context.selectedStoryIndex - 1 + len) % len);
                }
            }),
            nextStory: assign({
                selectedStoryIndex: (ctx, event) => {
                    const len = ctx.context.stories.length;
                    return Math.max(0, (ctx.context.selectedStoryIndex + 1) % len);
                }
            }),

            stopStory: assign({
                isStoryPlaying: (_ctx, _event) => false,
            }),

            togglePause: assign({
                isStoryPlaying: (ctx) => !ctx.context.isStoryPlaying,
            }),

            prevAI: assign({
                selectedAIIndex: (ctx, event) => {
                    const len = ctx.context.characters.length;
                    return Math.max(0, (ctx.context.selectedAIIndex - 1 + len) % len);
                }
            }),

            nextAI: assign({
                selectedAIIndex: (ctx, event) => {
                    const len = ctx.context.characters.length;
                    return Math.max(0, (ctx.context.selectedAIIndex + 1) % len);
                }
            }),
        },
        guards: {
            isStoriesSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 0,
            isChatSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 1,
            // Guard to check if at the leftmost menu item
            isAtLeftmost: (ctx) => ctx.context.topMenuHighlightedIndex === 0,
            // Guard to check if at the rightmost menu item
            isAtRightmost: (ctx) => ctx.context.topMenuHighlightedIndex >= ctx.context.topMenuSelection.length - 1,
        },
    }
);
