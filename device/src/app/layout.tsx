"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { LiveKitRoom } from "@livekit/components-react";
import { MediaDeviceFailure } from "livekit-client";
import useDeviceState from "./DeviceState";
import WebSocketStatus from "./components/WebSocketStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadata: Metadata = {
  title: "Curiousikid Player",
  description: "Interactive audio player with voice communication",
};

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // WebSocket server URL should come from environment variables in production
  const wsServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:8000/api/v1/ws/';
  const {
    livekitConnectionDetails,
    setIsLivekitRoomConnected,
    setIsConnectingToLivekit,
    setLivekitConnectionDetails
  } = useDeviceState();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WebSocketProvider serverUrl={wsServerUrl}>
          <LiveKitRoom
            serverUrl={livekitConnectionDetails?.serverUrl}
            token={livekitConnectionDetails?.participantToken}
            audio={true}
            video={false}
            connect={livekitConnectionDetails !== null}
            onConnected={() => {
              setIsConnectingToLivekit(false)
              setIsLivekitRoomConnected(true)
            }}
            onDisconnected={() => {
              setIsConnectingToLivekit(false)
              setIsLivekitRoomConnected(false)
              setLivekitConnectionDetails(null)
            }}
            onMediaDeviceFailure={onDeviceFailure}
          >
            {children}
          </LiveKitRoom>
        </WebSocketProvider>
      </body>
    </html>
  );
}
