import { createMachine, assign, MachineContext, createActor, fromPromise } from 'xstate';
import { LiveKitApi, LiveKitConnectionDetails, ConnectionMetadataType } from './api/livekit';
import { AgentState } from '@livekit/components-react';
import { BLANK_SCREEN } from './lib/pixel-gui/blank';
import { renderPlayback, renderTopMenu, renderStoryCover, renderCharacterCover, renderForwardPlayback, renderBackwardPlayback } from './PixelGuiRenderer';

const TEST_USER_ID = process.env.NEXT_PUBLIC_USER_ID as string;
console.log('TEST_USER_ID', TEST_USER_ID);

const LIVEKIT_API = new LiveKitApi()

export interface StoryMetadata {
    id: string;
    title: string;
    description: string;
    artist: string;
    audioUrl: string;
    duration: number;
    thumbnailUrl: string;
    pixelArtFile: string;
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
    background: string;
    traits: string;
    voice: string;
    pixelArtFile: string;
    pixelArtCover: string[][];
    description: string;
    speechExamples: string[];
    speakingStyle: string;
}

export enum BreadcrumbItem {
    MainMenu = "Main Menu",
    Stories = "Stories",
    Chat = "Chat",
}

export enum VoiceAgentModel {
    INACTIVE = 'Inactive',
    PROACTIVE_QUESTION = 'Proactive Question',
    USER_QUESTION = 'User Question',
    CHAT_CHARACTER = 'Chat Character',
}

export interface DeviceContext extends MachineContext {
    // user state
    userId: string;
    frame: number;

    // websocket state
    isWebSocketConnected: boolean;

    // screen state
    screen: string[][];
    topMenuSelections: string[];
    topMenuHighlightedIndex: number;
    isShowAIVoiceConsole: boolean;

    // livekit state  
    isConnectingToLivekit: boolean;
    agentState: AgentState;
    agentModel: VoiceAgentModel;
    livekitConnectionDetails: LiveKitConnectionDetails | null;

    // conversational story state
    currentStory: CurrentStory | null;
    stories: StoryMetadata[];
    proactiveQuestionPoint: ProactiveQuestionPoint | null;
    isStoryPlaying: boolean;
    selectedStoryIndex: number;

    // chat character state
    characters: ChatCharacter[];
    currentCharacter: ChatCharacter | null;
    selectedCharacterIndex: number;
}

export enum DeviceEventType {
    // websocket events
    SET_IS_WEBSOCKET_CONNECTED = 'SET_IS_WEBSOCKET_CONNECTED',

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
    STORY_QUESTION_SESSION_ENDED = 'STORY_QUESTION_SESSION_ENDED',
    START_PROACTIVE_QUESTION_SESSION = 'START_PROACTIVE_QUESTION_SESSION',
    START_USER_QUESTION_SESSION = 'START_USER_QUESTION_SESSION',

    // livekit events
    SET_IS_CONNECTING_TO_LIVEKIT = 'SET_IS_CONNECTING_TO_LIVEKIT',
    SET_LIVEKIT_ROOM_CONNECTED = 'SET_LIVEKIT_ROOM_CONNECTED',
    SET_AGENT_STATE = 'SET_AGENT_STATE',
    SET_AGENT_MODEL = 'SET_AGENT_MODEL',

    // chat events
    SET_CHAT_CHARACTERS = 'SET_CHAT_CHARACTERS',
}

export const deviceMachine = createMachine(
    {
        id: 'device',
        initial: 'mainMenu',
        context: {
            // user state
            userId: TEST_USER_ID,
            isWebSocketConnected: false,

            // screen state
            topMenuHighlightedIndex: 0,
            frame: 0,
            screen: BLANK_SCREEN,
            topMenuSelections: ["Conversational Audios Learning", "Chat with a Character"],
            isShowAIVoiceConsole: false,

            // livekit state
            isConnectingToLivekit: false,
            agentState: 'disconnected',
            agentModel: VoiceAgentModel.INACTIVE,
            livekitConnectionDetails: null,

            // conversational story state
            currentStory: null,
            proactiveQuestionPoint: null,
            stories: [],
            isStoryPlaying: false,
            selectedStoryIndex: 0,

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
                    ENTER_PRESSED: { target: 'inStory' },
                    ESC_PRESSED: { target: 'mainMenu' },
                },
            },
            inStory: { // Parent state for all story-related interactions
                initial: 'playing',
                on: {
                    // Common events handled by the parent state
                    ESC_PRESSED: { target: 'storiesSelection', actions: ['stopStory'] }, // Exit story mode
                    ENTER_PRESSED: { target: '.startingUserQuestionSession' }, // Initiate user question

                    // These might need to stay if specific sub-states shouldn't handle them, but let's try moving them
                    // START_PROACTIVE_QUESTION_SESSION: { target: '.startingProactiveQuestionSession' }, // Needs context of playing/paused
                    // SET_CURRENT_STORY: { actions: ['setCurrentStory'] }, // Handled within playing/paused if needed?
                    // SET_AGENT_MODEL: { actions: ['setAgentModel'] }, // Handled within playing/paused if needed?
                    STORY_ENDED: { target: 'storiesSelection', actions: ['stopStory'] }, // Exit story mode
                },
                states: {
                    playing: {
                        entry: [
                            'selectStory',
                            'startStory',
                            'renderPlaybackScreen'
                        ],
                        on: {
                            SPACE_PRESSED: { target: 'paused' }, // Go to paused state
                            STOP_PLAYBACK: { target: 'paused' }, // External signal to pause
                            SET_PROACTIVE_QUESTION_POINT: { actions: ['setProactiveQuestionPoint'] },
                            SET_CURRENT_STORY: [
                                {
                                    // First, check if the condition is met AFTER updating the story
                                    guard: 'isAtProactiveQuestionPoint',
                                    target: 'startingProactiveQuestionSession',
                                    // Apply the update AND transition
                                    actions: ['setCurrentStory']
                                },
                                {
                                    // Otherwise (guard fails), just apply the update
                                    actions: ['setCurrentStory']
                                }
                            ],
                            SET_AGENT_MODEL: { actions: ['setAgentModel'] },
                            LEFT_PRESSED: { target: 'backwardPlaybackWhilePlaying' }, // Initiate seek backward
                            RIGHT_PRESSED: { target: 'forwardPlaybackWhilePlaying' }, // Initiate seek forward
                        }
                    },
                    paused: {
                        entry: ['stopStory', 'renderPlaybackScreen'],
                        on: {
                            SPACE_PRESSED: { target: 'playing' }, // Resume playback
                            START_PLAYBACK: { target: 'playing' }, // External signal to play
                            LEFT_PRESSED: { target: 'backwardPlaybackWhilePaused' }, // Initiate seek backward
                            RIGHT_PRESSED: { target: 'forwardPlaybackWhilePaused' }, // Initiate seek forward
                        },
                    },
                    startingProactiveQuestionSession: {
                        entry: ['setConnectingToLivekit'],
                        invoke: {
                            src: 'connectToLivekit',
                            input: ({ context, event }) => {
                                return {
                                    agentType: 'proactive_question',
                                    userId: context.userId,
                                    metadata: context.proactiveQuestionPoint
                                }
                            },
                            onDone: {
                                target: 'proactiveQuestionSession', // Target sibling
                                actions: ['setLivekitConnectionDetails', 'unsetConnectingToLivekit']
                            },
                            onError: {
                                target: 'storyQuestionSessionEnded', // Target sibling
                            },
                        },
                        on: {
                            ESC_PRESSED: { target: 'storyQuestionSessionEnded' } // Target sibling
                        }
                    },
                    proactiveQuestionSession: {
                        entry: ['stopStory', 'showAIVoiceConsole', 'clearProactiveQuestionPoint'],
                        on: {
                            STORY_QUESTION_SESSION_ENDED: { target: 'storyQuestionSessionEnded' }, // Target sibling
                            ESC_PRESSED: { target: 'storyQuestionSessionEnded' } // Target sibling
                        },
                    },
                    startingUserQuestionSession: {
                        entry: ['setConnectingToLivekit'],
                        invoke: {
                            src: 'connectToLivekit',
                            input: ({ context, event }) => {
                                return {
                                    agentType: 'user_question',
                                    userId: context.userId,
                                    metadata: {
                                        storyId: context.currentStory?.id,
                                        userId: context.userId,
                                        interruptAt: context.currentStory?.currentTime,
                                    }
                                }
                            },
                            onDone: {
                                target: 'userQuestionSession', // Target sibling
                                actions: ['setLivekitConnectionDetails', 'unsetConnectingToLivekit']
                            },
                            onError: {
                                target: 'storyQuestionSessionEnded', // Target sibling
                            },
                        },
                        on: {
                            ESC_PRESSED: { target: 'storyQuestionSessionEnded' } // Target sibling
                        }
                    },
                    userQuestionSession: {
                        entry: ['stopStory', 'showAIVoiceConsole'],
                        on: {
                            STORY_QUESTION_SESSION_ENDED: { target: 'storyQuestionSessionEnded' }, // Target sibling
                            ESC_PRESSED: { target: 'storyQuestionSessionEnded' } // Target sibling
                        },
                    },
                    storyQuestionSessionEnded: {
                        // Use the reusable cleanup action & start story
                        entry: ['startStory', 'clearProactiveQuestionPoint', 'cleanupLivekitSession'],
                        // Target the parent state; it will enter its initial state ('playing')
                        always: { target: 'playing' } // Go specifically back to playing state
                    },
                    forwardPlaybackWhilePlaying: {
                        entry: ['forwardPlayback', 'renderForwardPlayback'],
                        after: {
                            // Target the parent state to return to last active substate (playing/paused)
                            200: { target: 'playing' }
                        },
                        on: {
                            // LEFT_PRESSED handled by parent 'inStory'
                            RIGHT_PRESSED: { target: 'forwardPlaybackWhilePlaying' } // Re-trigger self
                        }
                    },
                    backwardPlaybackWhilePlaying: {
                        entry: ['backwardPlayback', 'renderBackwardPlayback'],
                        after: {
                            // Target the parent state to return to last active substate (playing/paused)
                            200: { target: 'playing' }
                        },
                        on: {
                            LEFT_PRESSED: { target: 'backwardPlaybackWhilePlaying' }, // Re-trigger self
                            // RIGHT_PRESSED handled by parent 'inStory'
                        }
                    },
                    forwardPlaybackWhilePaused: {
                        entry: ['forwardPlayback', 'renderForwardPlayback'],
                        after: {
                            // Target the parent state to return to last active substate (playing/paused)
                            200: { target: 'paused' }
                        },
                        on: {
                            // LEFT_PRESSED handled by parent 'inStory'
                            RIGHT_PRESSED: { target: 'forwardPlaybackWhilePaused' } // Re-trigger self
                        }
                    },
                    backwardPlaybackWhilePaused: {
                        entry: ['backwardPlayback', 'renderBackwardPlayback'],
                        after: {
                            // Target the parent state to return to last active substate (playing/paused)
                            200: { target: 'paused' }
                        },
                        on: {
                            LEFT_PRESSED: { target: 'backwardPlaybackWhilePaused' }, // Re-trigger self
                            // RIGHT_PRESSED handled by parent 'inStory'
                        }
                    }
                }
            },
            chatSelection: {
                entry: ['renderCharacterCover'],
                on: {
                    LEFT_PRESSED: [
                        { guard: 'isAtChatSelectionLeftMost', target: 'chatSelectionBlinking' },
                        { actions: ['prevChatCharacter', 'renderCharacterCover'], target: 'chatSelection' }
                    ],
                    RIGHT_PRESSED: [
                        { guard: 'isAtChatSelectionRightMost', target: 'chatSelectionBlinking' },
                        { actions: ['nextChatCharacter', 'renderCharacterCover'], target: 'chatSelection' }
                    ],
                    ENTER_PRESSED: { target: 'startingChatCharacterSession', actions: ['selectChatCharacter'] },
                    ESC_PRESSED: { target: 'mainMenu' },
                },
            },
            startingChatCharacterSession: {
                entry: ['setConnectingToLivekit'],
                invoke: {
                    src: 'connectToLivekit',
                    input: ({ context, event }) => {
                        return {
                            agentType: 'chat_character',
                            userId: context.userId,
                            metadata: context.currentCharacter
                        }
                    },
                    onDone: {
                        target: 'chatCharacterSession',
                        actions: ['setLivekitConnectionDetails', 'unsetConnectingToLivekit']
                    },
                    onError: {
                        target: 'chatSelection',
                    },
                },
                on: {
                    ESC_PRESSED: { target: 'chatSelection' },
                    // Possibly handle SPACE for toggling mic, etc.
                },
            },
            chatCharacterSession: {
                entry: ['stopStory', 'showAIVoiceConsole'],
                on: {
                    ESC_PRESSED: { target: 'chatCharacterSessionEnded' }
                },
            },
            chatCharacterSessionEnded: {
                // Use the reusable cleanup action
                entry: ['cleanupLivekitSession'],
                always: { target: 'chatSelection' }
            },
            // Temporary state to show blank screen during left blink
            mainMenuBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: { 50: { target: 'mainMenu' } }
            },
            // Temporary state to show blank screen during left blink
            storiesSelectionBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: { 50: { target: 'storiesSelection' } }
            },
            chatSelectionBlinking: {
                entry: assign({ screen: BLANK_SCREEN }),
                after: { 50: { target: 'chatSelection' } }
            },
        },
        on: {
            SET_AGENT_STATE: {
                actions: ['setAgentState'],
            },
            SET_IS_WEBSOCKET_CONNECTED: {
                actions: ['setIsWebSocketConnected'],
            },
        },
    },
    {
        actors: {
            connectToLivekit: fromPromise(async ({ input }: { input: ConnectionMetadataType }) => {
                console.log("Connecting to LiveKit with metadata:", input);
                const livekitConnectionDetails = await LIVEKIT_API.getConnectionDetails(input);
                console.log("Connected to LiveKit with connection details:", livekitConnectionDetails);
                return livekitConnectionDetails as LiveKitConnectionDetails;
            }),
        },
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

            prevChatCharacter: assign({
                selectedCharacterIndex: ({ context, event }) => {
                    const len = context.characters.length;
                    return Math.max(0, (context.selectedCharacterIndex - 1 + len) % len);
                }
            }),

            nextChatCharacter: assign({
                selectedCharacterIndex: ({ context, event }) => {
                    const len = context.characters.length;
                    return Math.max(0, (context.selectedCharacterIndex + 1) % len);
                }
            }),

            selectChatCharacter: assign({
                currentCharacter: ({ context, event }) => {
                    return context.characters[context.selectedCharacterIndex];
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
                livekitConnectionDetails: ({ event }) => {
                    console.log("Assigning LiveKit details from actor output:", event.output);
                    return event.output as LiveKitConnectionDetails | null;
                }
            }),

            showAIVoiceConsole: assign({
                isShowAIVoiceConsole: ({ context, event }) => {
                    return true;
                }
            }),

            hideAIVoiceConsole: assign({
                isShowAIVoiceConsole: ({ context, event }) => {
                    return false;
                }
            }),

            setAgentState: assign({
                agentState: ({ context, event }) => {
                    console.log("setAgentState", event.payload);
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

            setAgentModel: assign({
                agentModel: ({ context, event }) => {
                    return event.payload.agentModel;
                }
            }),

            setAgentModelInactive: assign({
                agentModel: ({ context, event }) => {
                    return VoiceAgentModel.INACTIVE;
                }
            }),

            clearProactiveQuestionPoint: assign({
                proactiveQuestionPoint: ({ context, event }) => {
                    return null;
                }
            }),

            clearLivekitConnectionDetails: assign({
                livekitConnectionDetails: ({ context, event }) => {
                    return null;
                }
            }),

            setConnectingToLivekit: assign({
                isConnectingToLivekit: ({ context, event }) => {
                    return true;
                }
            }),

            unsetConnectingToLivekit: assign({
                isConnectingToLivekit: ({ context, event }) => {
                    return false;
                }
            }),

            // New reusable cleanup action
            cleanupLivekitSession: assign({
                isShowAIVoiceConsole: false,
                livekitConnectionDetails: null,
                isConnectingToLivekit: false, // Ensure this is reset
            }),
            // Define the action to update the websocket connection state
            setIsWebSocketConnected: assign({
                isWebSocketConnected: ({ context, event }) => {
                    // Ensure the event has the correct type and payload before accessing it
                    if (event.type === DeviceEventType.SET_IS_WEBSOCKET_CONNECTED && typeof event.payload?.isWebSocketConnected === 'boolean') {
                        console.log('Action: setIsWebSocketConnected state update', event.payload.isWebSocketConnected);
                        return event.payload.isWebSocketConnected;
                    }
                    // Return current context value if event is wrong type (shouldn't happen here but good practice)
                    return context.isWebSocketConnected; // Correctly access context here
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

            isProactiveQuestionActive: (ctx) => {
                const { agentModel, isStoryPlaying, agentState } = ctx.context;

                return agentModel === VoiceAgentModel.PROACTIVE_QUESTION && isStoryPlaying;
            },
            isUserQuestionActive: (ctx) => {
                const { agentModel, isStoryPlaying } = ctx.context;
                return agentModel === VoiceAgentModel.USER_QUESTION && isStoryPlaying;
            },
            isAtProactiveQuestionPoint: ({ context, event }) => {
                const isAtProactiveQuestionPoint =
                    event.type === DeviceEventType.SET_CURRENT_STORY &&
                    event.payload?.currentStory &&
                    context.proactiveQuestionPoint &&
                    event.payload.currentStory.currentTime >= context.proactiveQuestionPoint.connectAt &&
                    event.payload.currentStory.currentTime - context.proactiveQuestionPoint.connectAt <= 1;

                return isAtProactiveQuestionPoint;
            },
        },
    }
);

export const DEVICE_STATE_MACHINE_ACTOR = createActor(deviceMachine)

DEVICE_STATE_MACHINE_ACTOR.start()