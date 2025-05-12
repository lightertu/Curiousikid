'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useSidebar } from './sidebar-context';
import { User } from 'lucide-react';

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
            className="fixed top-0 bg-[#0A0A0A] border-b border-[#282828] h-16 flex items-center justify-between px-6 z-40"
            style={{
                left: navBarLeftOffset,
                width: navBarWidth,
            }}
        >
            <div>
                <div className="pt-4">
                    <Breadcrumb />
                </div>
            </div>

            <Link
                href="/login"
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
            >
                <User size={18} className="mr-2" />
                Sign in
            </Link>
        </div>
    );
} 