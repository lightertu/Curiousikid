'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrackTable } from './podcast/[id]/track-table';
import { getAllSongs, searchSongs } from '@/lib/db/queries';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
// Import the podcast component with dynamic import (no SSR)

async function Tracks({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const query = (await searchParams).q;
  const songs = query ? await searchSongs(query) : await getAllSongs();
  // @ts-ignore
  return <TrackTable query={query} playlist={{ songs }} />;
}

// Import PodcastList with dynamic import and disable SSR since it makes API calls on the client
const PodcastList = dynamic(() => import('./podcast-list'), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full flex items-center justify-center">
      <p className="text-zinc-400">Loading podcast player...</p>
    </div>
  )
});

export default function Page() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] pb-[69px] pt-2">
      <ScrollArea className="flex-1">
        <div className="px-6 pt-4">
          <h1 className="text-2xl font-bold text-white mb-6">Explore Podcasts</h1>
          <Suspense fallback={
            <div className="h-40 w-full flex items-center justify-center">
              <p className="text-zinc-400">Loading podcasts...</p>
            </div>
          }>
            <PodcastList />
          </Suspense>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
