import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { QuestionPoint } from "../GlobalState";

export const revalidate = 0;

export type LiveKitConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export interface ConnectionMetadata {
  questionPoint: QuestionPoint;
  userId: string;
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

export class LiveKitApi {
  async getConnectionDetails(metadata: ConnectionMetadata) {
    // Generate participant token
    const participantIdentity = metadata.questionPoint.userId;
    const roomName = `user-${metadata.userId}-story-${metadata.questionPoint.storyId}-${Date.now()}`;
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