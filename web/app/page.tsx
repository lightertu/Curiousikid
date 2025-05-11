'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getAllSongs, searchSongs } from '@/lib/db/queries';
import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useRouter } from 'next/navigation';
// Import the podcast component with dynamic import (no SSR)

const PodcastList = dynamic(() => import('./podcasts/podcast-list'), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-full flex items-center justify-center">
      <p className="text-zinc-400">Loading podcast player...</p>
    </div>
  )
});

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /podcasts when the component mounts
    router.push('/podcasts');
  }, [router]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] pb-[69px] pt-2">
      <ScrollArea className="flex-1">
        {/* <div className="px-6 pt-4">
          <Breadcrumb />
          <Suspense fallback={
            <div className="h-40 w-full flex items-center justify-center">
              <p className="text-zinc-400">Loading podcasts...</p>
            </div>
          }>
            <PodcastList />
          </Suspense>
        </div>
        <ScrollBar orientation="horizontal" /> */}
      </ScrollArea>
    </div>
  );
}
