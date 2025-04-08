import { createMachine, assign, MachineContext, createActor } from 'xstate';
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
                // Render the screen when entering this state
                entry: ['renderTopMenuScreen', 'updateBreadcrumb'],
                on: {
                    SET_STORIES: { actions: ['setStories'] },
                    SET_CHAT_CHARACTERS: { actions: ['setChatCharacters'] },
                    LEFT_PRESSED: [
                        // If at leftmost, go to blink state
                        { guard: 'isAtMainMenuLeftMost', target: 'mainMenuBlinking' },
                        // Otherwise, update index and re-enter mainMenu to trigger screen render
                        { actions: ['moveTopMenuSelectionLeft', 'renderTopMenuScreen'], target: 'mainMenu' }
                    ],
                    RIGHT_PRESSED: [
                        // If at rightmost, go to blink state
                        { guard: 'isAtMainMenuRightMost', target: 'mainMenuBlinking' },
                        // Otherwise, update index and re-enter mainMenu to trigger screen render
                        { actions: ['moveTopMenuSelectionRight', 'renderTopMenuScreen'], target: 'mainMenu' }
                    ],
                    ENTER_PRESSED: [
                        { guard: 'isStoriesSelected', target: 'storiesSelection', actions: ['updateBreadcrumb'] },
                        { guard: 'isChatSelected', target: 'chatSelection', actions: ['updateBreadcrumb'] },
                    ],
                },
            },
            storiesSelection: {
                on: {
                    LEFT_PRESSED: [
                        { guard: 'isAtStoriesSelectionLeftMost', target: 'storiesSelectionBlinking' },
                        { actions: ['prevStory', 'renderStoryMenu'], target: 'storiesSelection' }
                    ],
                    RIGHT_PRESSED: [
                        { guard: 'isAtStoriesSelectionRightMost', target: 'storiesSelectionBlinking' },
                        { actions: ['nextStory', 'renderStoryMenu'], target: 'storiesSelection' }
                    ],
                    ENTER_PRESSED: { target: 'storyPlayback' },
                    ESC_PRESSED: { target: 'mainMenu' },
                },
            },

            storyPlayback: {
                entry: [
                    'selectStory',
                    'setIsStoryPlaying'
                ],
                on: {
                    SPACE_PRESSED: { actions: ['togglePlayback'] },
                    SET_PROACTIVE_QUESTION_POINT: { actions: ['setProactiveQuestionPoint'] },
                    SET_CURRENT_STORY: { actions: ['setCurrentStory'] },
                    STORY_ENDED: { target: 'storiesSelection', actions: ['stopStory'] },
                    STOP_PLAYBACK: { actions: ['stopStory'] },
                    START_PLAYBACK: { actions: ['startStory'] },
                    ESC_PRESSED: { target: 'storiesSelection', actions: ['stopStory'] },
                },
            },

            chatSelection: {
                on: {
                    LEFT_PRESSED: { actions: ['prevAI'] },
                    RIGHT_PRESSED: { actions: ['nextAI'] },
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
                    console.log("setCurrentStory", event.payload);
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
        },
        guards: {
            isStoriesSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 0,
            isChatSelected: (ctx, event) => ctx.context.topMenuHighlightedIndex === 1,
            // Guard to check if at the leftmost menu item
            isAtMainMenuLeftMost: (ctx) => ctx.context.topMenuHighlightedIndex === 0,
            // Guard to check if at the rightmost menu item
            isAtMainMenuRightMost: (ctx) => ctx.context.topMenuHighlightedIndex >= 1,
            isAtStoriesSelectionLeftMost: (ctx) => ctx.context.selectedStoryIndex === 0,
            isAtStoriesSelectionRightMost: (ctx) => ctx.context.selectedStoryIndex >= ctx.context.stories.length - 1,
        },
    }
);

export const DEVICE_STATE_MACHINE_ACTOR = createActor(deviceMachine)

DEVICE_STATE_MACHINE_ACTOR.start()