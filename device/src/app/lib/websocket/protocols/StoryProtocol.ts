import { DeviceState, StoryMetadata, CurrentStory } from '@/app/GlobalState';
import { BaseProtocol } from '../BaseProtocol';
import { MessageType, Message } from '../MessageTypes';
import { WebSocketConnection } from '../Protocol';
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
  payload: {
    stories: StoryMetadata[];
  };
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
    interruptAt: number;
  };
}

export interface ACKSetQuestionPointMessage extends Message {
  type: MessageType.ACK_SET_QUESTION_POINT;
  payload: {
    storyId: string;
    questionPointId: string;
    interruptAt: number;
  };
}
/**
 * Protocol for handling story-related messages
 */
export class StoryProtocol extends BaseProtocol {
  private stories: StoryMetadata[] = [];
  private readonly globalState: DeviceState;
  
  // Callbacks for external components to hook into
  private onStoriesReceived?: (stories: StoryMetadata[]) => void;
  
  constructor(connection: WebSocketConnection) {
    super(
      'story',
      connection,
      [
        MessageType.GET_STORY_LIST,
        MessageType.STORY_SELECTED,
        MessageType.STORY_STARTED,
        MessageType.STORY_PAUSED,
      ]
    );
    this.globalState = useGlobalState.getState();  
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
  protected async handleStoryList(payload: SendStoryListMessage): Promise<void> {
    this.stories = payload.payload.stories;
    this.globalState.setStories(this.stories);
    if (this.onStoriesReceived) {
      this.onStoriesReceived(this.stories);
    }
  }
} 