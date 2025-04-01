import { DeviceState, StoryMetadata, CurrentStory } from '@/app/GlobalState';
import { BaseProtocol } from '../BaseProtocol';
import { MessageType, Message } from '../MessageTypes';
import { MessageHandler, WebSocketConnection } from '../Protocol';
import useGlobalState from '../../../GlobalState';


// Type definitions for story payloads
export interface GetStoryListMessage extends Message {
  type: MessageType.GET_STORY_LIST;
  payload: {
    userId: string;
  };
}

// Type definitions for story payloads
export interface SendStoryListMessage extends Message {
  type: MessageType.SEND_STORY_LIST;
  payload: StoryMetadata[];
}

// Type definitions for story payloads
export interface SetStoryProgressMessage extends Message {
  type: MessageType.SET_STORY_PROGRESS;
  payload: CurrentStory;
}

export interface SetQuestionPointMessage extends Message {
  type: MessageType.SET_QUESTION_POINT;
  payload: {
    storyId: string;
    questionPointId: string;
    connectAt: number;
    interruptAt: number;
  };
}

export interface ACKSetQuestionPointMessage extends Message {
  type: MessageType.ACK_SET_QUESTION_POINT;
  payload: {
    storyId: string;
    questionPointId: string;
    connectAt: number;
    interruptAt: number;
  };
}
/**
 * Protocol for handling story-related messages
 */
export class StoryProtocol extends BaseProtocol {
  constructor(connection: WebSocketConnection) {
    super(
      'story',
      connection,
      new Map<string, MessageHandler>([
        [MessageType.SEND_STORY_LIST, (payload: unknown) => this.handleStoryList(payload)],
        [MessageType.SET_QUESTION_POINT, (payload: unknown) => this.handleSetQuestionPoint(payload)],
      ])
    );
  }
  /**
   * Initialize the protocol
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Initial request for story list
    if (this.connection.isConnected()) {
      this.getStoryList({ 
        type: MessageType.GET_STORY_LIST,
        payload: { userId: "test-user" } 
      });
    }
  }
  
  /**
   * Request the list of available stories
   */
  getStoryList(payload: GetStoryListMessage): void {
    console.log("getStoryList", payload);
    this.send(MessageType.GET_STORY_LIST, {...payload });
  }
  
  /**
   * Update the playback progress
   * 
   * @param currentTime Current playback time in seconds
   * @param duration Total duration in seconds
   */
  setStoryProgress(payload: SetStoryProgressMessage): void {
    this.send(MessageType.SET_STORY_PROGRESS, {...payload });
  }
  
  /**
   * Handle STORY_LIST message
   */
  protected async handleStoryList(raw: unknown): Promise<void> {
    // Type guard to check if raw has the structure we expect
    console.log("handleStoryList RAW", raw);
    const message = raw as SendStoryListMessage;
    const globalState = useGlobalState.getState();
    globalState.setStories(message.payload);
  }

  /**
   * Handle SET_QUESTION_POINT message
   */
  protected async handleSetQuestionPoint(raw: unknown): Promise<void> {
    // Type guard to check if raw has the structure we expect
    const message = raw as SetQuestionPointMessage;
    const globalState = useGlobalState.getState();
    const { currentStory, isPlaying } = globalState;
      
    console.log("handleSetQuestionPoint.globalState", globalState);

    if (isPlaying && currentStory) {
      // Only update the current story if the storyId matches
      console.log("handleSetQuestionPoint", message);
      globalState.setQuestionPoint({
        storyId: currentStory.id,
        questionPointId: message.payload.questionPointId,
        connectAt: message.payload.connectAt,
        interruptAt: message.payload.interruptAt
      });

      this.send(MessageType.ACK_SET_QUESTION_POINT, {...message});
    }
  }
}
