'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

const DEFAULT_EXPANDED_WIDTH = 224;
const COLLAPSED_WIDTH = 72; // Standard width for an icon-only sidebar

interface SidebarContextType {
    sidebarWidth: number;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : DEFAULT_EXPANDED_WIDTH;

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prevCollapsed => !prevCollapsed);
    }, []);

    return (
        <SidebarContext.Provider value={{
            sidebarWidth,
            isCollapsed,
            toggleCollapse,
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