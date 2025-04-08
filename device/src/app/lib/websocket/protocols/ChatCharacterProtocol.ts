import { BaseProtocol } from '../BaseProtocol';
import { MessageType, Message } from '../MessageTypes';
import { MessageHandler, WebSocketConnection } from '../Protocol';
import useDeviceState, { ChatCharacter } from '../../../DeviceState';

// Type definitions for story payloads
export interface GetCharacterListMessage extends Message {
    type: MessageType.GET_CHAT_CHARACTER_LIST;
    payload: {
        userId: string;
    };
}

// Type definitions for story payloads
export interface SendChatCharacterListMessage extends Message {
    type: MessageType.SEND_CHAT_CHARACTER_LIST;
    payload: ChatCharacter[];
}

/**
 * Protocol for handling story-related messages
 */
export class ChatCharacterProtocol extends BaseProtocol {
    constructor(connection: WebSocketConnection) {
        super(
            'chat-character',
            connection,
            new Map<string, MessageHandler>([
                [MessageType.SEND_CHAT_CHARACTER_LIST, (payload: unknown) => this.handleSendChatCharacterList(payload)],
            ])
        );
    }
    /**
     * Initialize the protocol
     */
    async initialize(): Promise<void> {
        await super.initialize();
        const DeviceState = useDeviceState.getState();
        const userId = DeviceState.userId;

        // Initial request for story list
        if (this.connection.isConnected()) {
            this.getChatCharacterList({
                type: MessageType.GET_CHAT_CHARACTER_LIST,
                payload: { userId: userId },
            });
        }
    }

    /**
     * Request the list of available stories
     */
    getChatCharacterList(payload: GetCharacterListMessage): void {
        this.send(MessageType.GET_CHAT_CHARACTER_LIST, { ...payload });
    }

    /**
     * Handle CHARACTER_LIST message
     */
    protected async handleSendChatCharacterList(raw: unknown): Promise<void> {
        // Type guard to check if raw has the structure we expect
        const message = raw as SendChatCharacterListMessage;
        const DeviceState = useDeviceState.getState();
        DeviceState.setCharacters(message.payload);
    }
}
