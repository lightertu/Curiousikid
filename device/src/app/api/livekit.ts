import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { ProactiveQuestionPoint, ChatCharacter, UserProactiveQuestionPoint } from "../DeviceState";

export const revalidate = 0;

export type LiveKitConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export type AgentType = "proactive_question" | "chat_character" | "user_question";

export interface ParticipantConnectionMetadata {
  agentType: AgentType;
  userId: string;
}

export interface ProactiveQuestionConnectionMetadata extends ParticipantConnectionMetadata {
  metadata: ProactiveQuestionPoint;
}

export interface ChatCharacterConnectionMetadata extends ParticipantConnectionMetadata {
  metadata: ChatCharacter;
}

export interface UserQuestionConnectionMetadata extends ParticipantConnectionMetadata {
  metadata: UserProactiveQuestionPoint;
}

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
if (process.env.LIVEKIT_URL === undefined) {
  throw new Error("LIVEKIT_URL is not defined");
}
if (process.env.LIVEKIT_API_KEY === undefined) {
  throw new Error("LIVEKIT_API_KEY is not defined");
}
if (process.env.LIVEKIT_API_SECRET === undefined) {
  throw new Error("LIVEKIT_API_SECRET is not defined");
}

console.log("LIVEKIT_URL", LIVEKIT_URL);
console.log("LIVEKIT_API_KEY", LIVEKIT_API_KEY);
console.log("LIVEKIT_API_SECRET", LIVEKIT_API_SECRET);

// Define the union type alias
type ConnectionMetadataType = ProactiveQuestionConnectionMetadata | ChatCharacterConnectionMetadata | UserQuestionConnectionMetadata;

export class LiveKitApi {
  async getConnectionDetails(metadata: ConnectionMetadataType) {
    // Generate participant token
    const participantIdentity = metadata.userId;
    const roomName = `user-${metadata.userId}-${Date.now()}`;
    const participantToken = await this.createParticipantToken(
      LIVEKIT_API_KEY as string,
      LIVEKIT_API_SECRET as string,
      {
        identity: participantIdentity,
        metadata: JSON.stringify(metadata),
      },
      roomName
    );

    // Return connection details
    const data: LiveKitConnectionDetails = {
      serverUrl: LIVEKIT_URL as string,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });

    return data;
  }

  private createParticipantToken(
    apiKey: string,
    apiSecret: string,
    userInfo: AccessTokenOptions,
    roomName: string): Promise<string> {
    const at = new AccessToken(apiKey, apiSecret, {
      ...userInfo,
      ttl: "15m",
    });
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };
    at.addGrant(grant);
    return at.toJwt();
  }
}