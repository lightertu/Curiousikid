'use client';

// Remove old context import if only used for these variables
// import { usePlayback } from './playback-context';
import { useAppStore } from '@/lib/store';
// Keep playback context if needed for currentTrack (will be refactored later)
import { usePlayback } from './playback-context';

import { PanelRightOpen } from 'lucide-react'; // Icon for expanding

export function ExpandNowPlayingButton() {
    // Get state and actions from Zustand store
    const isNowPlayingOpen = useAppStore((state) => state.isNowPlayingOpen);
    const toggleNowPlaying = useAppStore((state) => state.toggleNowPlaying);
    // Get currentTrack from PlaybackContext for now
    const { currentTrack } = usePlayback();

    // const { isNowPlayingOpen, toggleNowPlaying, currentTrack } = usePlayback(); // Old way

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