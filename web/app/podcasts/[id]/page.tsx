'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Podcast, PodcastClient } from '@/lib/api/podcast-client';
import { PodcastEpisodeSelection } from './podcast-episode-selection';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { MicVocal } from 'lucide-react';

const podcastClient = new PodcastClient();

export default function PodcastDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
      <div className="container">
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
      <div className="container">
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
  const handleAIChatClick = () => {
    console.log("AI Chat button clicked for podcast:", podcast?.id);
    // Implement your voice chat initiation logic here
    alert("Initiating AI Voice Chat with the host! (Feature coming soon)");
  };

  const DESCRIPTION_CHAR_LIMIT = 230;
  const description = podcast.desc || '';
  const isLongDescription = description.length > DESCRIPTION_CHAR_LIMIT;

  const displayedDescription = isLongDescription && !isDescriptionExpanded
    ? `${description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`
    : description;

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div className="container">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Podcast cover image */}
        <div className="relative w-48 h-48 self-start rounded-lg overflow-hidden shadow-lg shrink-0">
          <Image
            src={podcast.thumbnail || '/placeholder.svg'}
            alt={podcast.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Container for text and AI chat button */}
        <div className="flex-1">
          {/* Podcast information */}
          <div className="flex items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{podcast.name}</h1>
              <p className="text-gray-400 mb-4">By {podcast.creator?.name}</p>
            </div>

            {/* Aurora Orb AI Chat Button - Positioned right where user circled */}
            <div className="shrink-0 ml-4 -mt-1">
              <button
                onClick={handleAIChatClick}
                className="
                  w-14 h-14 md:w-16 md:h-16 
                  rounded-full
                  bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 
                  p-2.5 md:p-3
                  shadow-[0_0_15px_5px_rgba(128,0,128,0.4),_0_0_30px_10px_rgba(0,0,255,0.3)] 
                  animate-pulse-glow 
                  hover:shadow-[0_0_20px_8px_rgba(128,0,128,0.6),_0_0_40px_15px_rgba(0,0,255,0.4)] 
                  hover:scale-105 
                  transition-all duration-300 ease-in-out
                  flex items-center justify-center
                "
                aria-label="Chat with AI Host via Voice"
                title="Chat with AI Host"
              >
                <MicVocal className="w-7 h-7 md:w-8 md:h-8 text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-xs">
              {episodeCount} Episodes
            </span>
            {/* Additional tags could go here */}
          </div>

          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {displayedDescription}
          </p>
          {isLongDescription && (
            <button
              onClick={toggleDescription}
              className="text-blue-400 hover:text-blue-300 mt-2 text-sm font-medium"
            >
              {isDescriptionExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      <PodcastEpisodeSelection podcast={podcast} />
    </div>
  );
}
