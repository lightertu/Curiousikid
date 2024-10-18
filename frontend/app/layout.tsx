// @ts-ignore

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NowPlaying } from './now-playing';
import { PlaybackContextProvider } from './playback-context';
import { getAllPlaylists } from '@/lib/db/queries';
import { OptimisticPlaylists } from './optimistic-playlists';
import { PlaylistContextProvider } from './hooks/use-playlist';
import { PlaybackControls } from './playback-controls';
import "@livekit/components-styles";

export const metadata: Metadata = {
  title: 'Next.js Music Player',
  description: 'A music player built with Next.js.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playlistsPromise = getAllPlaylists();

  return (
    <html lang="en" className={inter.className}>
      <body className="flex flex-col md:flex-row h-[100dvh] text-gray-200">
        <PlaybackContextProvider>
          <PlaylistContextProvider playlistsPromise={playlistsPromise}>
            <OptimisticPlaylists />
            {children}
          </PlaylistContextProvider>
          <NowPlaying />
          <PlaybackControls />
        </PlaybackContextProvider>
      </body>
    </html>
  );
}
