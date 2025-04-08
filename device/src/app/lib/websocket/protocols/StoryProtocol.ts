import useDeviceState, { DeviceState, StoryMetadata, CurrentStory, ProactiveQuestionPoint } from '@/app/DeviceState';
import { BaseProtocol } from '../BaseProtocol';
import { MessageType, Message } from '../MessageTypes';
import { MessageHandler, WebSocketConnection } from '../Protocol';
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType, deviceMachine } from '@/app/DeviceStateMachine';


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

export interface SetProactiveQuestionPointMessage extends Message {
  type: MessageType.SET_QUESTION_POINT;
  payload: ProactiveQuestionPoint;
}

export interface ACKSetProactiveQuestionPointMessage extends Message {
  type: MessageType.ACK_SET_QUESTION_POINT;
  payload: ProactiveQuestionPoint;
}

export interface ClearProactiveQuestionPointMessage extends Message {
  type: MessageType.CLEAR_QUESTION_POINT;
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
        [MessageType.SET_QUESTION_POINT, (payload: unknown) => this.handleSetProactiveQuestionPoint(payload)],
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
      const DeviceState = useDeviceState.getState();
      const userId = DeviceState.userId;
      this.getStoryList({
        type: MessageType.GET_STORY_LIST,
        payload: { userId: userId }
      });
    }
  }

  /**
   * Request the list of available stories
   */
  getStoryList(payload: GetStoryListMessage): void {
    this.send(MessageType.GET_STORY_LIST, { ...payload });
  }

  /**
   * Update the playback progress
   * 
   * @param currentTime Current playback time in seconds
   * @param duration Total duration in seconds
   */
  setStoryProgress(payload: SetStoryProgressMessage): void {
    this.send(MessageType.SET_STORY_PROGRESS, { ...payload });
  }

  clearProactiveQuestionPoint(payload: ClearProactiveQuestionPointMessage): void {
    this.send(MessageType.CLEAR_QUESTION_POINT, { ...payload });
  }

  /**
   * Handle STORY_LIST message
   */
  protected async handleStoryList(raw: unknown): Promise<void> {
    // Type guard to check if raw has the structure we expect
    const message = raw as SendStoryListMessage;
    DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SET_STORIES, payload: { stories: message.payload } });
  }

  /**
   * Handle SET_QUESTION_POINT message
   */
  protected async handleSetProactiveQuestionPoint(raw: unknown): Promise<void> {
    // Type guard to check if raw has the structure we expect
    // const message = raw as SetProactiveQuestionPointMessage;
    // const { currentStory, isPlaying } = DEVICE_STATE_MACHINE_ACTOR

    // console.log("handleSetProactiveQuestionPoint.DeviceState", DeviceState);

    // if (isPlaying && currentStory) {
    //   // Only update the current story if the storyId matches
    //   console.log("handleSetProactiveQuestionPoint", message);
    //   DeviceState.setProactiveQuestionPoint(message.payload);

    //   this.send(MessageType.ACK_SET_QUESTION_POINT, { ...message });
    // }
  }
}
