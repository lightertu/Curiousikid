import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import { WebSocketProvider } from "./contexts/WebSocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Curiousikid Player",
  description: "Interactive audio player with voice communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // WebSocket server URL should come from environment variables in production
  const wsServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:8000/api/v1/ws/';
  
  console.log('wsServerUrl', wsServerUrl);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WebSocketProvider serverUrl={wsServerUrl}>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
