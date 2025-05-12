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
            /*
              Main content area top padding.
              This should be: NavBar height + desired gap below NavBar.
              Current NavBar height is h-16 (64px).
              Current gap is 20px.
              So, 64px + 20px = 84px. (pt-[84px])
              If you change NavBar height or desired gap, update this value.
            */
            className="h-full overflow-y-auto pb-[69px] px-6 pt-[84px]"
            style={{ marginLeft: isMobileView ? '0px' : `${sidebarWidth}px` }}
        >
            {children}
        </main>
    );
} 