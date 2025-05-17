'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { Song } from '@/lib/db/types';
import { useAppStore } from '@/lib/store';

const DEFAULT_NOW_PLAYING_WIDTH = 288; // Approx w-72
const NOW_PLAYING_COLLAPSE_THRESHOLD_DRAG = 100; // If dragged smaller than this, it collapses

// Audio fade configuration
const FADE_OUT_DURATION = 500; // Duration of fade-out in milliseconds
const FADE_OUT_CURVE = 'linear'; // 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
const FADE_OUT_MIN_VOLUME = 0; // Minimum volume during fade-out (0-1)

type Panel = 'sidebar' | 'tracklist' | 'nowPlaying';

type PlaybackContextType = {
  isPlayingIntent: boolean;
  currentTrack: Song | null;
  currentTime: number;
  duration: number;
  pausePlayback: () => void;
  togglePlayPause: () => void;
  playTrack: (track: Song) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaylist: (songs: Song[]) => void;
  seekTo: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  activePanel: Panel | null;
  setActivePanel: (panel: Panel | null) => void;
  registerPanelRef: (panel: Panel, ref: React.RefObject<HTMLElement>) => void;
  handleKeyNavigation: (e: React.KeyboardEvent, panel: Panel) => void;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

function useKeyboardNavigation() {
  const [activePanel, setActivePanel_local] = useState<Panel | null>(null);
  const panelRefs = useRef<Record<Panel, React.RefObject<HTMLElement> | null>>({
    sidebar: null,
    tracklist: null,
    nowPlaying: null,
  });

  const storeSetActivePanel = useAppStore((state) => state.setActivePanel);

  const setActivePanel = useCallback(
    (panel: Panel | null) => {
      setActivePanel_local(panel);
      storeSetActivePanel(panel);
    },
    [storeSetActivePanel]
  );

  const registerPanelRef = useCallback(
    (panel: Panel, ref: React.RefObject<HTMLElement>) => {
      panelRefs.current[panel] = ref;
    },
    []
  );

  const handleKeyNavigation = useCallback(
    (e: React.KeyboardEvent, panel: Panel) => {
      const currentRef = panelRefs.current[panel];
      if (!currentRef?.current) return;

      const items = Array.from(
        currentRef.current.querySelectorAll('[tabindex="0"]')
      );
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          (items[nextIndex] as HTMLElement).focus();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          (items[prevIndex] as HTMLElement).focus();
          break;
        case 'h':
          if (panel === 'tracklist') {
            e.preventDefault();
            setActivePanel('sidebar');
            const sidebarFirstItem =
              panelRefs.current.sidebar?.current?.querySelector(
                '[tabindex="0"]'
              ) as HTMLElement | null;
            sidebarFirstItem?.focus();
          }
          break;
        case 'l':
          if (panel === 'sidebar') {
            e.preventDefault();
            setActivePanel('tracklist');
            const tracklistFirstItem =
              panelRefs.current.tracklist?.current?.querySelector(
                '[tabindex="0"]'
              ) as HTMLElement | null;
            tracklistFirstItem?.focus();
          }
          break;
      }
    },
    [setActivePanel]
  );

  return { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation };
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [isPlayingIntent, setIsPlayingIntent] = useState(false);
  const [currentTrack, setCurrentTrackInternal] = useState<Song | null>(null);
  const [currentTime, setCurrentTimeInternal] = useState(0);
  const [duration, setDurationInternal] = useState(0);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { activePanel, setActivePanel, registerPanelRef, handleKeyNavigation } =
    useKeyboardNavigation();

  const pausePlayback = useCallback(() => {
    setIsPlayingIntent(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlayingIntent((prevIsPlaying) => !prevIsPlaying);
  }, []);

  const playTrack = useCallback(
    (track: Song) => {
      setCurrentTrackInternal(track);
      setIsPlayingIntent(true);
      setCurrentTimeInternal(0);

      useAppStore.setState({
        isNowPlayingOpen: true,
        nowPlayingWidth: useAppStore.getState().nowPlayingWidth,
        activePanel: 'nowPlaying',
      });
    },
    []
  );

  const playNextTrack = useCallback(() => {
    if (currentTrack && playlist.length > 0) {
      const currentIndex = playlist.findIndex(
        (track) => track.id === currentTrack.id
      );
      const nextIndex = (currentIndex + 1) % playlist.length;
      playTrack(playlist[nextIndex]);
    }
  }, [currentTrack, playlist, playTrack]);

  const playPreviousTrack = useCallback(() => {
    if (currentTrack && playlist.length > 0) {
      const currentIndex = playlist.findIndex(
        (track) => track.id === currentTrack.id
      );
      const previousIndex =
        (currentIndex - 1 + playlist.length) % playlist.length;
      playTrack(playlist[previousIndex]);
    }
  }, [currentTrack, playlist, playTrack]);

  const setCurrentTime = useCallback((time: number) => {
    setCurrentTimeInternal(time);
  }, []);

  const setDuration = useCallback((newDuration: number) => {
    setDurationInternal(newDuration);
  }, []);

  // Placeholder for seekTo - actual implementation will be in PlaybackControls
  // This function in the context will be overridden by PlaybackControls if it needs to provide one,
  // or PlaybackControls can directly handle seek actions triggered by ProgressBar without needing this.
  // For now, let's provide a no-op here. The component actually performing seek will manage it.
  const seekTo = useCallback((time: number) => {
    console.warn("PlaybackContext: seekTo called, but not implemented at context level. Should be handled by player component.");
    // The component owning the audio element should handle seeking directly.
    // It can still call setCurrentTime from context if needed after a successful seek.
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement | null;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [togglePlayPause]);

  return (
    <PlaybackContext.Provider
      value={{
        isPlayingIntent,
        currentTrack,
        currentTime,
        duration,
        pausePlayback,
        togglePlayPause,
        playTrack,
        playNextTrack,
        playPreviousTrack,
        setCurrentTime,
        setDuration,
        setPlaylist,
        seekTo,
        audioRef,
        activePanel,
        setActivePanel,
        registerPanelRef,
        handleKeyNavigation,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
