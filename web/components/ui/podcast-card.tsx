"use client";

import React from 'react';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import { PlayIcon, Headphones } from 'lucide-react';
import Link from 'next/link';
import { Podcast } from '@/lib/api/podcast-client';

interface PodcastCardProps {
    podcast: Podcast;
    onClick?: () => void;
}

export const PodcastCard = ({
    podcast,
    onClick
}: PodcastCardProps) => {
    return (
        <div className="group relative w-full">
            <Link href={`/podcasts/${podcast.id}`} passHref>
                <div
                    className="rounded-md overflow-hidden bg-zinc-900 transition-all duration-300 
                    hover:shadow-lg hover:shadow-zinc-800 cursor-pointer flex flex-col h-full"
                    onClick={onClick}
                >
                    <div className="relative overflow-hidden">
                        {/* Image with aspect ratio */}
                        <AspectRatio.Root ratio={1 / 1} className="w-full">
                            <img
                                src={podcast.thumbnail || '/placeholder-podcast.jpg'}
                                alt={podcast.name}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/40 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="p-3 rounded-full bg-green-500 shadow-lg">
                                    <PlayIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </AspectRatio.Root>
                    </div>

                    {/* Metadata section */}
                    <div className="p-2 px-3 flex-1">
                        <h3 className="font-medium text-sm text-white line-clamp-1 mb-1">{podcast.name}</h3>
                        <div className="flex items-center text-zinc-400 text-xs">
                            <Headphones className="w-3 h-3 mr-1" />
                            <span>{podcast.episodes.length} episodes</span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default PodcastCard; 