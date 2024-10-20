import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant
} from "livekit-server-sdk";
import { NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY as string;
const API_SECRET = process.env.LIVEKIT_API_SECRET as string;
const LIVEKIT_URL = process.env.LIVEKIT_URL as string;

export type LiveKitAuthPutResponse = {
  serverUrl: string;
  roomName: string;
  participantId: string;
  participantToken: string;
};

export interface LiveKitAuthPutRequest {
  participantId: string;
  roomName: string;
}

export async function PUT(request: Request) {
  if (LIVEKIT_URL === undefined) {
    throw new Error("LIVEKIT_URL is not defined");
  }

  try {
    const requestPayload: LiveKitAuthPutRequest = await request.json()
    const participantToken = await createParticipantToken(
        {
          identity: requestPayload.participantId,
        },
        requestPayload.roomName
    );

    // Return connection details
    const response: LiveKitAuthPutResponse = {
      serverUrl: LIVEKIT_URL,
      roomName: requestPayload.roomName,
      participantToken: participantToken,
      participantId: requestPayload.participantId,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);

      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = "100m";
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
