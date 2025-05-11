'use client';

import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useEffect, useState } from 'react';
import { Episode as ApiEpisode, Podcast as ApiPodcast, PodcastClient } from '@/lib/api/podcast-client';
import { PodcastEpisodeSelection, Podcast } from './podcast-episode-selection';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const podcastClient = new PodcastClient();

export default function PodcastDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [podcast, setPodcast] = useState<ApiPodcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPodcast() {
      try {
        setIsLoading(true);
        const data = await podcastClient.getPodcastById(id);
        setPodcast(data);
        // Add a view when loaded
        // await podcastClient.addPodcastView(id);
      } catch (err) {
        console.error('Error fetching podcast:', err);
        setError('Failed to load podcast details');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchPodcast();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8 mb-8 animate-pulse">
          <Skeleton className="w-48 h-48 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* <Skeleton className="h-8 w-48 mb-4" /> */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Podcast</h1>
          <p className="text-gray-400 mb-6">{error || 'Podcast not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get the correct episode count
  const episodeCount = Array.isArray(podcast.episodes) ? podcast.episodes.length : 0;

  // Convert podcast to the format expected by PodcastEpisodePlayer
  const adaptedPodcast: Podcast = {
    id: podcast.id,
    name: podcast.name,
    description: podcast.desc,
    thumbnail: podcast.thumbnail,
    creator: podcast.creator ? {
      id: podcast.creator_id,
      name: podcast.creator.name
    } : undefined,
    episodes: Array.isArray(podcast.episodes)
      ? podcast.episodes
        .filter((ep): ep is ApiEpisode => typeof ep !== 'string')
        .map(ep => ({
          id: ep.id,
          name: ep.name,
          description: ep.desc,
          file: ep.file,
          duration: ep.duration,
          thumbnail: ep.thumbnail,
          publishedAt: ep.created_at
        }))
      : []
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="relative w-48 h-48 self-start rounded-lg overflow-hidden shadow-lg">
          <Image
            src={podcast.thumbnail || '/placeholder.svg'}
            alt={podcast.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{podcast.name}</h1>
          <p className="text-gray-400 mb-4">By {podcast.creator?.name}</p>
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-xs">
              {episodeCount} Episodes
            </span>
            {/* Additional tags could go here */}
          </div>
          <p className="text-gray-300 leading-relaxed">{podcast.desc}</p>
        </div>
      </div>

      <PodcastEpisodeSelection podcast={adaptedPodcast} />
    </div>
  );
}
