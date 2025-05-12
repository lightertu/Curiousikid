'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

const DEFAULT_EXPANDED_WIDTH = 224;
const COLLAPSED_WIDTH = 72; // Standard width for an icon-only sidebar

interface SidebarContextType {
    sidebarWidth: number;
    isCollapsed: boolean;
    toggleCollapse: () => void;
    setSidebarWidth: (width: number) => void; // For resizer
    isResizing: boolean;
    setIsResizing: (resizing: boolean) => void;
    lastExpandedWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(DEFAULT_EXPANDED_WIDTH);
    const [lastStoredExpandedWidth, setLastStoredExpandedWidth] = useState(DEFAULT_EXPANDED_WIDTH);
    const [isResizingState, setIsResizingState] = useState(false);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prevCollapsed => {
            const nextCollapsed = !prevCollapsed;
            if (nextCollapsed) {
                setLastStoredExpandedWidth(currentWidth);
                setCurrentWidth(COLLAPSED_WIDTH);
            } else {
                setCurrentWidth(lastStoredExpandedWidth);
            }
            return nextCollapsed;
        });
    }, [currentWidth, lastStoredExpandedWidth]);

    const setSidebarWidthCallback = useCallback((newWidth: number) => {
        if (!isCollapsed) {
            setCurrentWidth(newWidth);
            setLastStoredExpandedWidth(newWidth);
        }
    }, [isCollapsed]);

    return (
        <SidebarContext.Provider value={{
            sidebarWidth: currentWidth,
            isCollapsed,
            toggleCollapse,
            setSidebarWidth: setSidebarWidthCallback,
            isResizing: isResizingState,
            setIsResizing: setIsResizingState,
            lastExpandedWidth: lastStoredExpandedWidth,
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
} 