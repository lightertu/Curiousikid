'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useSidebar } from './sidebar-context';
import { User } from 'lucide-react';

export function NavBar() {
    const { sidebarWidth: leftSidebarWidth } = useSidebar();
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navBarLeftOffset = isMobileView ? '0px' : `${leftSidebarWidth}px`;
    const navBarCalculatedWidth = `calc(100% - ${leftSidebarWidth}px)`;

    return (
        <div
            className="fixed top-0 bg-[#0A0A0A] border-b border-[#282828] h-16 flex items-center justify-between px-6 z-40"
            style={{
                left: navBarLeftOffset,
                width: navBarCalculatedWidth,
                transition: 'left 0.2s ease-out, width 0.2s ease-out',
            }}
        >
            <div> {/* Breadcrumb container */}
                <Breadcrumb />
            </div>

            <Link
                href="/login"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 flex-shrink-0"
            >
                <User size={18} className="mr-2" />
                Sign in
            </Link>
        </div>
    );
} 