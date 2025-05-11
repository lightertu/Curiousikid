"use client";

import React, { useEffect, useState } from 'react';
import PodcastGrid from '@/components/ui/podcast-grid';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Podcast, PodcastClient } from '@/lib/api/podcast-client';

// Initialize the podcast client
const podcastClient = new PodcastClient();

export function PodcastList() {
    const [allPodcasts, setAllPodcasts] = useState<Podcast[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPodcasts() {
            try {
                setIsLoading(true);

                // Fetch popular podcasts
                const podcasts = await podcastClient.getAllPodcasts();
                setAllPodcasts(podcasts);

                setError(null);
            } catch (err) {
                console.error('Error fetching podcasts:', err);
                setError('Failed to load podcasts. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPodcasts();
    }, []);

    const handlePodcastClick = async (id: string) => {
        console.log(`Podcast clicked: ${id}`);
        try {
            // Add a view when a podcast is clicked
            await podcastClient.addPodcastView(id);
        } catch (err) {
            console.error('Error adding podcast view:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px] w-full">
                <div className="flex flex-col items-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-zinc-400">Loading podcasts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[300px] w-full">
                <div className="flex flex-col items-center text-center">
                    <p className="text-red-500 mb-2">⚠️</p>
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-zinc-700 text-white px-4 py-2 rounded-md hover:bg-zinc-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {allPodcasts.length > 0 && (
                <PodcastGrid
                    title="All Podcasts"
                    podcasts={allPodcasts}
                    onCardClick={handlePodcastClick}
                />
            )}

            {allPodcasts.length === 0 && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <p className="text-zinc-400">No podcasts found</p>
                </div>
            )}
        </div>
    );
}

// Add a default export to ensure compatibility with dynamic imports
export default PodcastList; 