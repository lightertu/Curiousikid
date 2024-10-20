import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant
} from "livekit-server-sdk";
import { NextResponse } from "next/server";
import {Song} from "@/lib/db/types";

const API_KEY = process.env.LIVEKIT_API_KEY as string;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export type LiveKitAuthPutResponse = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export interface LiveKitAuthPutRequest {
  participantIdentity: string;
  podcast: Song;
  podcastTimestamp: string;
}

export async function PUT(request: Request) {
  if (LIVEKIT_URL === undefined) {
    throw new Error("LIVEKIT_URL is not defined");
  }

  try {
    const requestPayload: LiveKitAuthPutRequest = await request.json()
    const roomName: string = `${requestPayload.podcast.id}-${requestPayload.participantIdentity}`;
    const participantToken = await createParticipantToken(
        {
          identity: requestPayload.participantIdentity,
          metadata: JSON.stringify({
            podcas: requestPayload.podcast,
            podcastTimestamp: requestPayload.podcastTimestamp
          })
        },
        roomName
    );

    // Return connection details
    const response: LiveKitAuthPutResponse = {
      serverUrl: LIVEKIT_URL,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantToken,
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
