'use client';

import { usePlayback } from './playback-context';
import { PanelRightOpen } from 'lucide-react'; // Icon for expanding

export function ExpandNowPlayingButton() {
    const { isNowPlayingOpen, toggleNowPlaying, currentTrack } = usePlayback();

    if (isNowPlayingOpen || !currentTrack) {
        return null; // Don't show if the panel is already open or if there is no current track
    }

    return (
        <button
            onClick={toggleNowPlaying}
            className="fixed right-6 top-28 -translate-y-1/2 z-[55] p-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full shadow-lg transition-colors"
            aria-label="Open Now Playing panel"
            title="Open Now Playing"
        >
            <PanelRightOpen size={28} />
        </button>
    );
} 