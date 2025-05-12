import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NowPlaying } from './now-playing';
import { PlaybackProvider } from './playback-context';
import { getAllPlaylists } from '@/lib/db/queries';
import { SideBar } from './side-bar';
import { PlaylistProvider } from './hooks/use-playlist';
import { PlaybackControls } from './playback-controls';
import { SidebarProvider } from './sidebar-context';
import { MainContentWrapper } from './main-content-wrapper';

export const metadata: Metadata = {
  title: 'Podcast App',
  description: 'Listen to your favorite podcasts',
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
      <body className="dark bg-[#0A0A0A] text-gray-200 h-[100dvh] overflow-hidden">
        <PlaybackProvider>
          <SidebarProvider>
            <PlaylistProvider playlistsPromise={playlistsPromise}>
              <SideBar />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </PlaylistProvider>
            <NowPlaying />
            <PlaybackControls />
          </SidebarProvider>
        </PlaybackProvider>
      </body>
    </html>
  );
}
