'use client';

import { usePlayback } from '@/app/playback-context';
import { formatDuration, highlightText } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Play, Pause, Plus, Clock, Share, Bookmark, Calendar } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlaylist } from '@/app/hooks/use-playlist';
import { addToPlaylistAction } from '@/app/actions';
import Image from 'next/image';

export interface Creator {
    id: string;
    name: string;
}

export interface Episode {
    id: string;
    name: string;
    description?: string;
    file: string;
    duration?: number;
    thumbnail?: string;
    publishedAt?: string;
}

export interface Podcast {
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    creator?: Creator;
    episodes: Episode[];
}

function EpisodeCard({
    episode,
    podcast,
    isSelected,
    onSelect,
    query,
}: {
    episode: Episode;
    podcast: Podcast;
    isSelected: boolean;
    onSelect: () => void;
    query?: string;
}) {
    let {
        currentTrack,
        playTrack,
        togglePlayPause,
        isPlaying,
        setActivePanel,
    } = usePlayback();
    let { playlists } = usePlaylist();

    let [isFocused, setIsFocused] = useState(false);
    let isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

    // Convert episode to track format for playback system
    const trackForPlayback = {
        id: episode.id,
        name: episode.name,
        artist: podcast.creator?.name || 'Unknown',
        album: podcast.name,
        duration: episode.duration || 0,
        file: episode.file,
        audioUrl: episode.file,
        imageUrl: episode.thumbnail || podcast.thumbnail
    };

    let isCurrentTrack = currentTrack?.id === episode.id;
    const publishDate = episode.publishedAt
        ? new Date(episode.publishedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        : '';

    function onClickEpisode() {
        setActivePanel('tracklist');
        onSelect();
        if (isCurrentTrack) {
            togglePlayPause();
        } else {
            playTrack(trackForPlayback);
        }
    }

    function onKeyDownEpisode(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
            if (isCurrentTrack) {
                togglePlayPause();
            } else {
                playTrack(trackForPlayback);
            }
        }
    }

    return (
        <div
            className={`group rounded-lg overflow-hidden bg-[#1A1A1A] hover:bg-[#252525] transition-colors duration-200 p-4 relative ${isSelected || isFocused ? 'ring-1 ring-[#1e3a8a]' : ''
                }`}
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={onKeyDownEpisode}
        >
            <div className="flex">
                {/* Episode thumbnail */}
                <div className="relative w-20 h-20 min-w-20 rounded-md overflow-hidden mr-4">
                    <Image
                        src={episode.thumbnail || podcast.thumbnail || '/placeholder.svg'}
                        alt={`${episode.name} thumbnail`}
                        fill
                        className="object-cover"
                    />

                    {/* Play button overlay */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center bg-black/40 
                            ${isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
                            transition-opacity cursor-pointer`}
                        onClick={onClickEpisode}
                    >
                        {isCurrentTrack && isPlaying ? (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <div className="flex items-end justify-center space-x-[3px] h-3">
                                    <div className="w-1 bg-white animate-now-playing-1"></div>
                                    <div className="w-1 bg-white animate-now-playing-2 [animation-delay:0.2s]"></div>
                                    <div className="w-1 bg-white animate-now-playing-3 [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Episode details */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3
                            className="font-medium text-white mb-1 hover:text-blue-400 transition-colors cursor-pointer line-clamp-2"
                            onClick={onClickEpisode}
                        >
                            {highlightText(episode.name, query)}
                        </h3>

                        {/* Options menu */}
                        <div className="ml-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        disabled={isProduction}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-white focus:text-white opacity-0 group-hover:opacity-100"
                                    >
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">Episode options</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        className="text-xs"
                                        onClick={() => {
                                            if (isCurrentTrack) {
                                                togglePlayPause();
                                            } else {
                                                playTrack(trackForPlayback);
                                            }
                                        }}
                                    >
                                        {isCurrentTrack && isPlaying ? (
                                            <>
                                                <Pause className="mr-2 size-3 stroke-[1.5]" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 size-3 stroke-[1.5]" />
                                                Play
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs">
                                        <Bookmark className="mr-2 size-3 stroke-[1.5]" />
                                        Save Episode
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs">
                                        <Share className="mr-2 size-3 stroke-[1.5]" />
                                        Share Episode
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="text-xs">
                                            <Plus className="mr-2 size-3" />
                                            Add to Playlist
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="w-48">
                                            {playlists.map((playlist) => (
                                                <DropdownMenuItem
                                                    className="text-xs"
                                                    key={playlist.id}
                                                    onClick={() => {
                                                        addToPlaylistAction(playlist.id, episode.id);
                                                    }}
                                                >
                                                    {playlist.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Episode meta info */}
                    <div className="text-xs text-gray-400 mb-2">
                        {publishDate && (
                            <span className="inline-flex items-center mr-3">
                                <Calendar className="inline-block mr-1 size-3" />
                                {publishDate}
                            </span>
                        )}
                        <span className="inline-flex items-center">
                            <Clock className="inline-block mr-1 size-3" />
                            {formatDuration(episode.duration || 0)}
                        </span>
                    </div>

                    {/* Description */}
                    {episode.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                            {highlightText(episode.description, query)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PodcastEpisodeSelection({
    podcast,
    query,
}: {
    podcast: Podcast;
    query?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { registerPanelRef, setActivePanel, setPlaylist } = usePlayback();
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

    // Convert episodes to the track format expected by the playback system
    const songsForPlayback = podcast.episodes.map(episode => ({
        id: episode.id,
        name: episode.name,
        artist: podcast.creator?.name || 'Unknown',
        album: podcast.name,
        duration: episode.duration || 0,
        file: episode.file,
        audioUrl: episode.file,
        imageUrl: episode.thumbnail || podcast.thumbnail
    }));

    useEffect(() => {
        registerPanelRef('tracklist', containerRef);
    }, [registerPanelRef]);

    useEffect(() => {
        setPlaylist(songsForPlayback);
    }, [podcast.episodes, setPlaylist]);

    const hasEpisodes = podcast.episodes && podcast.episodes.length > 0;

    if (!hasEpisodes) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <div className="mb-4">
                    <Image
                        src={podcast.thumbnail || '/placeholder.svg'}
                        alt={podcast.name}
                        width={120}
                        height={120}
                        className="rounded-lg"
                    />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Episodes Available</h3>
                <p className="max-w-md text-sm">
                    This podcast doesn't have any episodes yet. Check back later for updates.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full pb-24" ref={containerRef} onClick={() => setActivePanel('tracklist')}>
            <div className="podcast-episode-header mb-4">
                <h2 className="text-lg font-semibold text-white mb-2">Episodes ({podcast.episodes.length})</h2>
                <p className="text-sm text-gray-400">
                    Listen to the latest episodes from {podcast.creator?.name || 'this podcast'}
                </p>
            </div>

            <div className="grid gap-4 grid-cols-1">
                {podcast.episodes.map((episode) => (
                    <EpisodeCard
                        key={episode.id}
                        episode={episode}
                        podcast={podcast}
                        isSelected={selectedEpisodeId === episode.id}
                        onSelect={() => setSelectedEpisodeId(episode.id)}
                        query={query}
                    />
                ))}
            </div>
        </div>
    );
} 