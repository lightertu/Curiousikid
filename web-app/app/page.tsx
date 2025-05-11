'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getAllSongs, searchSongs } from '@/lib/db/queries';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Breadcrumb } from '@/components/ui/breadcrumb';
// Import the podcast component with dynamic import (no SSR)

async function Tracks({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const query = (await searchParams).q;
  const songs = query ? await searchSongs(query) : await getAllSongs();
  // @ts-ignore
  return <TrackTable query={query} epsiodes={{ songs }} />;
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
          <Breadcrumb />
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
