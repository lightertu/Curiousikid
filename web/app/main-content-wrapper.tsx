'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSidebar } from './sidebar-context';

export function MainContentWrapper({ children }: { children: ReactNode }) {
    const { sidebarWidth } = useSidebar();
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768); // Tailwind md breakpoint
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <main
            className="h-full overflow-y-auto pb-[69px] px-6 pt-[88px]"
            style={{ marginLeft: isMobileView ? '0px' : `${sidebarWidth}px` }}
        >
            {children}
        </main>
    );
} 