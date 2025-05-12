"use client";

import React from 'react';
import PodcastCard from './podcast-card';
import { Podcast } from '@/lib/api/podcast-client';

interface PodcastGridProps {
    podcasts: Podcast[];
    title?: string;
    onCardClick?: (id: string) => void;
}

const PodcastGrid = ({ podcasts, title, onCardClick }: PodcastGridProps) => {
    return (
        <div className="w-full mb-8">
            {title && (
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6">
                {podcasts.map((podcast) => (
                    <PodcastCard
                        key={podcast.id}
                        podcast={podcast}
                        onClick={() => onCardClick?.(podcast.id)}
                    />
                ))}
            </div>

            {podcasts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-zinc-400 text-center">No podcasts found</p>
                </div>
            )}
        </div>
    );
};

export default PodcastGrid; 