import { createMachine, assign, MachineContext, createActor } from 'xstate';
import { LiveKitConnectionDetails } from './api/livekit';
import { AgentState } from '@livekit/components-react';
import { BLANK_SCREEN } from './lib/pixel-gui/blank';
import { renderPlayback, renderTopMenu, renderStoryCover, renderCharacterCover, renderForwardPlayback, renderBackwardPlayback } from './PixelGuiRenderer';

const TEST_USER_ID = process.env.NEXT_PUBLIC_USER_ID as string;

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
    pixelArtCover: string[][];
}

export enum BreadcrumbItem {
    MainMenu = "Main Menu",
    Stories = "Stories",
    Chat = "Chat",
}

export interface DeviceContext extends MachineContext {
    // user state
    userId: string;
    frame: number;
    topMenuSelectedIndex: number;

    // websocket state
    isWebSocketConnected: boolean;

    // screen state
    screen: string[][];
    topMenuSelections: string[];
    topMenuHighlightedIndex: number;

    // livekit state  
    isConnectingToLivekit: boolean;
    agentState: AgentState;
    isLivekitRoomConnected: boolean;
    livekitConnectionDetails: LiveKitConnectionDetails | null;

    // conversational story state
    currentStory: CurrentStory | null;
    stories: StoryMetadata[];
    proactiveQuestionPoint: ProactiveQuestionPoint | null;
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
    // Keyboard events
    ESC_PRESSED = 'ESC_PRESSED',
    ESC_LONG_PRESSED = 'ESC_LONG_PRESSED',
    ENTER_PRESSED = 'ENTER_PRESSED',
    LEFT_PRESSED = 'LEFT_PRESSED',
    RIGHT_PRESSED = 'RIGHT_PRESSED',
    SPACE_PRESSED = 'SPACE_PRESSED',

    // story events
    SET_STORIES = 'SET_STORIES',
    SET_PROACTIVE_QUESTION_POINT = 'SET_PROACTIVE_QUESTION_POINT',
    SET_CURRENT_STORY = 'SET_CURRENT_STORY',
    SELECT_STORY = 'SELECT_STORY',
    STORY_ENDED = 'STORY_ENDED',
    STOP_PLAYBACK = 'STOP_PLAYBACK',
    START_PLAYBACK = 'START_PLAYBACK',
    PROACTIVE_QUESTION_SESSION_STARTED = 'PROACTIVE_QUESTION_SESSION_STARTED',
    PROACTIVE_QUESTION_SESSION_ENDED = 'PROACTIVE_QUESTION_SESSION_ENDED',

    // livekit events
    SET_IS_CONNECTING_TO_LIVEKIT = 'SET_IS_CONNECTING_TO_LIVEKIT',
    SET_LIVEKIT_CONNECTION_DETAILS = 'SET_LIVEKIT_CONNECTION_DETAILS',
    SET_LIVEKIT_ROOM_CONNECTED = 'SET_LIVEKIT_ROOM_CONNECTED',
    SET_AGENT_STATE = 'SET_AGENT_STATE',

    // chat events
    SET_CHAT_CHARACTERS = 'SET_CHAT_CHARACTERS',
}

export type DeviceEvent =
    | { type: DeviceEventType.ESC_PRESSED }
    | { type: DeviceEventType.ESC_LONG_PRESSED }
    | { type: DeviceEventType.ENTER_PRESSED }
    | { type: DeviceEventType.LEFT_PRESSED }
    | { type: DeviceEventType.RIGHT_PRESSED }
    | { type: DeviceEventType.SPACE_PRESSED }
    | { type: DeviceEventType.SET_STORIES, payload: { stories: StoryMetadata[] } }
    | { type: DeviceEventType.SET_CURRENT_STORY, payload: { currentStory: CurrentStory } }
    | { type: DeviceEventType.SET_PROACTIVE_QUESTION_POINT, payload: { proactiveQuestionPoint: ProactiveQuestionPoint } }
    | { type: DeviceEventType.STORY_ENDED }
    | { type: DeviceEventType.STOP_PLAYBACK }
    | { type: DeviceEventType.START_PLAYBACK }
    | { type: DeviceEventType.SET_CHAT_CHARACTERS, payload: { characters: ChatCharacter[] } }

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
            frame: 0,
            screen: BLANK_SCREEN,
            topMenuSelections: ["Conversational Stories", "Chat with a Character"],
            // livekit state
            isConnectingToLivekit: false,
            agentState: 'disconnected',
            isLivekitRoomConnected: false,
            livekitConnectionDetails: null,

            // conversational story state
            currentStory: null,
            proactiveQuestionPoint: null,
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
                entry: ['renderTopMenuScreen', 'updateBreadcrumb'],
                on: {
                    SET_STORIES: { actions: ['setStories'] },
                    SET_CHAT_CHARACTERS: { actions: ['setChatCharacters'] },
                    LEFT_PRESSED: [
                        { guard: 'isAtMainMenuLeftMost', target: 'mainMenuBlinking' },
                        { actions: ['moveTopMenuSelectionLeft', 'renderTopMenuScreen'], target: 'mainMenu' }
                    ],
                    RIGHT_PRESSED: [
                        { guard: 'isAtMainMenuRightMost', target: 'mainMenuBlinking' },
                        { actions: ['moveTopMenuSelectionRight', 'renderTopMenuScreen'], target: 'mainMenu' }
                    ],
                    ENTER_PRESSED: [
                        { guard: 'isStoriesSelected', target: 'storiesSelection', actions: ['updateBreadcrumb'] },
                        { guard: 'isChatSelected', target: 'chatSelection', actions: ['updateBreadcrumb'] },
                    ],
                },
            },
            storiesSelection: {
                entry: ['renderStoryCover'],
                on: {
                    LEFT_PRESSED: [
                        { guard: 'isAtStoriesSelectionLeftMost', target: 'storiesSelectionBlinking' },
                        { actions: ['prevStory', 'renderStoryCover'], target: 'storiesSelection' }
                    ],
                    RIGHT_PRESSED: [
                        { guard: 'isAtStoriesSelectionRightMost', target: 'storiesSelectionBlinking' },
                        { actions: ['nextStory', 'renderStoryCover'], target: 'storiesSelection' }
                    ],
                    ENTER_PRESSED: { target: 'storyIsPlaying' },
                    ESC_PRESSED: { target: 'mainMenu' },
                },
            },
            storyIsPlaying: {
                entry: [
                    'selectStory',
                    'setIsStoryPlaying',
                    'renderPlaybackScreen'
                ],
                on: {
                    ESC_PRESSED: { target: 'storiesSelection', actions: ['stopStory'] },
                    LEFT_PRESSED: { target: 'backwardPlaybackBlinking' },
                    RIGHT_PRESSED: { target: 'forwardPlaybackBlinking' },
                    SPACE_PRESSED: { actions: ['stopStory'], target: 'storyIsPaused' },
                    STOP_PLAYBACK: { actions: ['stopStory'] },
                    START_PLAYBACK: { actions: ['startStory'] },
                    SET_PROACTIVE_QUESTION_POINT: { actions: ['setProactiveQuestionPoint'] },
                    PROACTIVE_QUESTION_SESSION_STARTED: { target: 'proactiveQuestionSession' },
                    PROACTIVE_QUESTION_SESSION_ENDED: { target: 'storyIsPlaying' },
                    SET_CURRENT_STORY: { actions: ['setCurrentStory'] },
                    STORY_ENDED: { target: 'storiesSelection', actions: ['stopStory'] },
                },
            },
            storyIsPaused: {
                entry: ['renderPlaybackScreen'],
                on: {
                    SPACE_PRESSED: { actions: ['startStory'], target: 'storyIsPlaying' },
                    ESC_PRESSED: { target: 'storiesSelection', actions: ['stopStory'] },
                    SET_PROACTIVE_QUESTION_POINT: { actions: ['setProactiveQuestionPoint'] },
                },
            },
            proactiveQuestionSession: {
                entry: ['renderProactiveQuestionSession'],
                on: {
                    PROACTIVE_QUESTION_SESSION_ENDED: {
                        target: 'storyIsPlaying',
                        actions: ['stopStory']
                    },
                },
            },
            chatSelection: {
                entry: ['renderCharacterCover'],
                on: {
                    LEFT_PRESSED: [
                        { guard: 'isAtChatSelectionLeftMost', target: 'chatSelectionBlinking' },
                        { actions: ['prevAI', 'renderCharacterCover'], target: 'chatSelection' }
                    ],
                    RIGHT_PRESSED: [
                        { guard: 'isAtChatSelectionRightMost', target: 'chatSelectionBlinking' },
                        { actions: ['nextAI', 'renderCharacterCover'], target: 'chatSelection' }
                    ],
                    ENTER_PRESSED: { target: 'chatActive' },
                    ESC_PRESSED: { target: 'mainMenu' },
                },
            },
            chatActive: {
                on: {
                    ESC_PRESSED: { target: 'chatSelection' },
                    // Possibly handle SPACE for toggling mic, etc.
                },
            },
            // Temporary state to show blank screen during left blink
            mainMenuBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: {
                    50: { target: 'mainMenu' } // After 50ms, go back to mainMenu
                }
            },
            // Temporary state to show blank screen during left blink
            storiesSelectionBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: {
                    50: { target: 'storiesSelection' } // After 50ms, go back to storiesSelection
                }
            },
            // Temporary state to show blank screen during left blink
            forwardPlaybackBlinking: {
                entry: ['forwardPlayback', 'renderForwardPlayback'],
                after: {
                    200: { target: 'storyIsPlaying' } // After 50ms, go back to storiesSelection
                },
                on: {
                    LEFT_PRESSED: { target: 'backwardPlaybackBlinking' },
                    RIGHT_PRESSED: { target: 'forwardPlaybackBlinking' }
                }
            },
            backwardPlaybackBlinking: {
                entry: ['backwardPlayback', 'renderBackwardPlayback'],
                after: {
                    200: { target: 'storyIsPlaying' }
                },
                on: {
                    LEFT_PRESSED: { target: 'backwardPlaybackBlinking' },
                    RIGHT_PRESSED: { target: 'forwardPlaybackBlinking' }
                }
            },
            chatSelectionBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: {
                    50: { target: 'chatSelection' }
                }
            },
        },
        on: {
            TICK: {
                // global event for animation
                actions: assign({
                    frame: ({ context, event }) => context.frame + 1,
                }),
            },
        },
    },
    {
        actions: {
            // High-level example implementations
            moveTopMenuSelectionLeft: assign({
                topMenuHighlightedIndex: ({ context, event }) => {
                    console.log("moveTopMenuSelectionLeft Before", context.topMenuHighlightedIndex);
                    const newIndex = context.topMenuHighlightedIndex - 1;
                    console.log("moveTopMenuSelectionLeft After", newIndex);
                    if (newIndex < 0) {
                        return 0;
                    } else {
                        return newIndex;
                    }
                },
            }),
            moveTopMenuSelectionRight: assign({
                topMenuHighlightedIndex: ({ context, event }) => {
                    console.log("moveTopMenuSelectionRight Before", context.topMenuHighlightedIndex);
                    const newIndex = context.topMenuHighlightedIndex + 1;
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
                screen: ({ context, event }) => {
                    console.log("renderTopMenu Screen", context.topMenuHighlightedIndex);
                    // Pass the context directly now
                    return renderTopMenu(context);
                }
            }),

            setCurrentStory: assign({
                currentStory: ({ context, event }) => {
                    // console.log("setCurrentStory", event.payload);
                    return event.payload.currentStory;
                }
            }),

            setIsStoryPlaying: assign({
                isStoryPlaying: ({ context, event }) => true,
            }),

            setIsStoryPaused: assign({
                isStoryPlaying: ({ context, event }) => false,
            }),

            isStoriesSelected: ({ context, event }) => {
                console.log("isStoriesSelected", context.topMenuHighlightedIndex);
                return context.topMenuHighlightedIndex === 0;
            },

            isChatSelected: ({ context, event }) => {
                console.log("isChatSelected", context.topMenuHighlightedIndex);
                return context.topMenuHighlightedIndex === 1;
            },

            prevStory: assign({
                selectedStoryIndex: ({ context, event }) => {
                    const len = context.stories.length;
                    return Math.max(0, (context.selectedStoryIndex - 1 + len) % len);
                }
            }),
            nextStory: assign({
                selectedStoryIndex: ({ context, event }) => {
                    const len = context.stories.length;
                    return Math.max(0, (context.selectedStoryIndex + 1) % len);
                }
            }),

            stopStory: assign({
                isStoryPlaying: ({ context, event }) => false,
            }),

            startStory: assign({
                isStoryPlaying: ({ context, event }) => true,
            }),

            togglePlayback: assign({
                isStoryPlaying: ({ context, event }) => !context.isStoryPlaying,
            }),

            prevAI: assign({
                selectedAIIndex: ({ context, event }) => {
                    const len = context.characters.length;
                    return Math.max(0, (context.selectedAIIndex - 1 + len) % len);
                }
            }),

            // Action to simply log the event when ENTER is pressed in mainMenu
            debugActionRecieved: ({ context, event }) => {
                console.log("debugActionRecieved: Event received in mainMenu on ENTER", event);
            },

            nextAI: assign({
                selectedAIIndex: ({ context, event }) => {
                    const len = context.characters.length;
                    return Math.max(0, (context.selectedAIIndex + 1) % len);
                }
            }),

            setStories: assign({
                stories: ({ context, event }) => {
                    return event.payload.stories;
                }
            }),

            setChatCharacters: assign({
                characters: ({ context, event }) => {
                    return event.payload.characters;
                }
            }),

            setProactiveQuestionPoint: assign({
                proactiveQuestionPoint: ({ context, event }) => {
                    return event.payload.proactiveQuestionPoint;
                }
            }),

            setIsConnectingToLivekit: assign({
                isConnectingToLivekit: ({ context, event }) => {
                    return event.payload.isConnectingToLivekit;
                }
            }),

            setLivekitConnectionDetails: assign({
                livekitConnectionDetails: ({ context, event }) => {
                    return event.payload.livekitConnectionDetails;
                }
            }),

            setLivekitRoomConnected: assign({
                isLivekitRoomConnected: ({ context, event }) => {
                    return event.payload.isLivekitRoomConnected;
                }
            }),

            setAgentState: assign({
                agentState: ({ context, event }) => {
                    return event.payload.agentState;
                }
            }),

            selectStory: assign({
                currentStory: ({ context, event }) => {
                    const story = context.stories[context.selectedStoryIndex];
                    if (story.id === context.currentStory?.id) {
                        return context.currentStory;
                    } else {
                        return {
                            ...story,
                            currentTime: 0,
                        };
                    }
                }
            }),

            renderPlaybackScreen: assign({
                screen: ({ context, event }) => {
                    return renderPlayback(context);
                }
            }),

            renderStoryCover: assign({
                screen: ({ context, event }) => {
                    return renderStoryCover(context);
                }
            }),

            renderCharacterCover: assign({
                screen: ({ context, event }) => {
                    return renderCharacterCover(context);
                }
            }),

            renderForwardPlayback: assign({
                screen: ({ context, event }) => {
                    return renderForwardPlayback(context);
                }
            }),

            renderBackwardPlayback: assign({
                screen: ({ context, event }) => {
                    return renderBackwardPlayback(context);
                }
            }),

            forwardPlayback: assign({
                currentStory: ({ context, event }) => {
                    if (context.currentStory) {
                        if (context.currentStory.currentTime + 10 < context.currentStory.duration) {
                            return {
                                ...context.currentStory,
                                currentTime: context.currentStory.currentTime + 10,
                            }
                        } else {
                            return {
                                ...context.currentStory,
                            }
                        }
                    } else {
                        return null;
                    }
                }
            }),

            backwardPlayback: assign({
                currentStory: ({ context, event }) => {
                    if (context.currentStory) {
                        return {
                            ...context.currentStory,
                            currentTime: Math.max(0, context.currentStory.currentTime - 10),
                        }
                    } else {
                        return null;
                    }
                }
            }),
        },
        guards: {
            isAtMainMenuLeftMost: (ctx) => ctx.context.topMenuHighlightedIndex === 0,
            isAtMainMenuRightMost: (ctx) => ctx.context.topMenuHighlightedIndex >= 1,

            isChatSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 1,
            isAtChatSelectionLeftMost: (ctx) => ctx.context.selectedCharacterIndex === 0,
            isAtChatSelectionRightMost: (ctx) => ctx.context.selectedCharacterIndex >= ctx.context.characters.length - 1,

            isStoriesSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 0,
            isStoryPlaying: (ctx) => ctx.context.isStoryPlaying,
            isStoryPaused: (ctx) => !ctx.context.isStoryPlaying,
            isAtStoriesSelectionLeftMost: (ctx) => ctx.context.selectedStoryIndex === 0,
            isAtStoriesSelectionRightMost: (ctx) => ctx.context.selectedStoryIndex >= ctx.context.stories.length - 1,
        },
    }
);

export const DEVICE_STATE_MACHINE_ACTOR = createActor(deviceMachine)

DEVICE_STATE_MACHINE_ACTOR.start()