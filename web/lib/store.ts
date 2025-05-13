import { create } from 'zustand';

const DEFAULT_EXPANDED_WIDTH = 224;
const COLLAPSED_WIDTH = 72; // Standard width for an icon-only sidebar

interface SidebarState {
    isCollapsed: boolean;
    sidebarWidth: number;
    toggleCollapse: () => void;
}

interface AppState extends SidebarState {
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

    // --- Other state slices will be added below ---
})); 