import { create } from 'zustand';

// --- Sidebar Constants ---
const DEFAULT_EXPANDED_WIDTH = 224;
const COLLAPSED_WIDTH = 72; // Standard width for an icon-only sidebar

// --- Now Playing Panel Constants ---
const DEFAULT_NOW_PLAYING_WIDTH = 288; // Approx w-72
const NOW_PLAYING_COLLAPSE_THRESHOLD_DRAG = 100; // If dragged smaller than this, it collapses

interface SidebarState {
    isCollapsed: boolean;
    sidebarWidth: number;
    toggleCollapse: () => void;
}

// Temporary type for Panel until fully refactored
type Panel = 'sidebar' | 'tracklist' | 'nowPlaying';

interface NowPlayingPanelState {
    isNowPlayingOpen: boolean;
    nowPlayingWidth: number;
    toggleNowPlaying: () => void;
    setNowPlayingWidth: (width: number) => void;
    attemptCollapseNowPlaying: (currentWidth: number) => void;
}

// Temporary activePanel state for this checkpoint
interface NavigationState {
    activePanel: Panel | null;
    setActivePanel: (panel: Panel | null) => void;
}

interface AppState extends SidebarState, NowPlayingPanelState, NavigationState {
    // Other state slices will be added here
}

export const useAppStore = create<AppState>((set, get) => ({
    // --- Sidebar State ---
    isCollapsed: false,
    sidebarWidth: DEFAULT_EXPANDED_WIDTH,
    toggleCollapse: () =>
        set((state) => ({
            isCollapsed: !state.isCollapsed,
            sidebarWidth: !state.isCollapsed
                ? COLLAPSED_WIDTH
                : DEFAULT_EXPANDED_WIDTH,
        })),

    // --- Now Playing Panel State ---
    isNowPlayingOpen: false,
    nowPlayingWidth: DEFAULT_NOW_PLAYING_WIDTH,
    toggleNowPlaying: () => {
        const isOpen = get().isNowPlayingOpen;
        set({
            isNowPlayingOpen: !isOpen,
            nowPlayingWidth: !isOpen ? DEFAULT_NOW_PLAYING_WIDTH : get().nowPlayingWidth,
        });
        // Call setActivePanel from within the action
        get().setActivePanel(!isOpen ? 'nowPlaying' : null);
    },
    setNowPlayingWidth: (width: number) => set({ nowPlayingWidth: width }),
    attemptCollapseNowPlaying: (currentWidth: number) => {
        if (get().isNowPlayingOpen && currentWidth < NOW_PLAYING_COLLAPSE_THRESHOLD_DRAG) {
            set({ isNowPlayingOpen: false });
            // Call setActivePanel from within the action
            get().setActivePanel(null);
        }
    },

    // --- Navigation State (Temporary for this checkpoint) ---
    activePanel: null,
    setActivePanel: (panel: Panel | null) => set({ activePanel: panel }),

    // --- Other state slices will be added below ---
})); 