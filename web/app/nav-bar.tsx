'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useSidebar } from './sidebar-context';

export function NavBar() {
    const { sidebarWidth } = useSidebar();
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768); // Tailwind md breakpoint
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navBarLeftOffset = isMobileView ? '0px' : `${sidebarWidth}px`;
    const navBarWidth = isMobileView ? '100%' : `calc(100% - ${sidebarWidth}px)`;

    return (
        <div
            className="fixed top-0 bg-[#0A0A0A] border-b border-[#282828] h-16 flex px-6 z-40"
            style={{
                left: navBarLeftOffset,
                width: navBarWidth,
            }}
        >
            {/* 
              Adjust pt-X to control the Breadcrumb's vertical position within the NavBar.
              NavBar height is h-16 (64px). 
              Increasing pt-X pushes the Breadcrumb down.
              Decreasing pt-X raises it.
              Current: pt-6 (24px from the top of the NavBar).
            */}
            <div className="pt-4">
                <Breadcrumb />
            </div>
        </div>
    );
} 