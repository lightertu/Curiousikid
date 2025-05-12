'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSidebar } from './sidebar-context';
import { usePlayback } from './playback-context';

export function MainContentWrapper({ children }: { children: ReactNode }) {
    const { sidebarWidth: leftSidebarWidth } = useSidebar();
    const { isNowPlayingOpen, nowPlayingWidth } = usePlayback();
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const marginLeft = isMobileView ? '0px' : `${leftSidebarWidth}px`;
    const marginRight = isMobileView ? '0px' : (isNowPlayingOpen ? `${nowPlayingWidth}px` : '0px');

    return (
        <main
            className="h-full overflow-y-auto pb-[69px] px-6 pt-[88px]"
            style={{
                marginLeft: marginLeft,
                marginRight: marginRight,
                transition: 'margin-left 0.2s ease-out, margin-right 0.2s ease-out',
            }}
        >
            {children}
        </main>
    );
} 