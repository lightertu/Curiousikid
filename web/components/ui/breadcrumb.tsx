"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

type BreadcrumbConfig = {
    [key: string]: {
        label: string;
        hidden?: boolean;
    }
};

// Path segment to display name mapping
const pathMap: BreadcrumbConfig = {
    '': { label: 'Podcasts' },
    'podcast': { label: 'Podcasts' },
};

export function Breadcrumb() {
    const pathname = usePathname();

    // Remove trailing slash and split the path into segments
    const segments = pathname?.replace(/\/$/, '').split('/').filter(Boolean) || [];

    // Create breadcrumb items with readable names
    const breadcrumbs = segments.map((segment, index) => {
        let displayName;
        // Check if the current segment is a podcast ID by looking at the previous segment
        const isPodcastIdSegment = segments[index - 1] === 'podcasts' && index > 0;

        if (isPodcastIdSegment) {
            displayName = 'Episodes'; // Display "Episodes" for podcast ID segments
        } else {
            // Original logic for non-ID segments or other types of dynamic segments
            // You might still want a generic ID check here for other parts of your site
            const isPotentiallyOtherId = segment.length > 10 || segment.includes('-');
            if (isPotentiallyOtherId) {
                displayName = 'Details'; // Fallback for other generic IDs
            } else {
                displayName = pathMap[segment]?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
            }
        }

        // Create the URL for this breadcrumb by joining all segments up to this one
        const url = `/${segments.slice(0, index + 1).join('/')}`;

        // Check if this segment should be hidden in breadcrumbs
        const isHidden = pathMap[segment]?.hidden;

        return {
            name: displayName,
            url,
            isLast: index === segments.length - 1,
            isHidden
        };
    });

    // Filter out any hidden segments
    const visibleBreadcrumbs = breadcrumbs.filter(crumb => !crumb.isHidden);

    // If we're at the home page, just show "Home"
    if (visibleBreadcrumbs.length === 0) {
        return (
            <h1 className="text-2xl font-bold text-white mb-6">Home</h1>
        );
    }

    return (
        <div className="mb-6">
            <div className="flex items-center text-2xl font-bold text-white">
                <Link href="/" className="hover:text-zinc-300 transition-colors">
                    Home
                </Link>

                {visibleBreadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.url}>
                        <ChevronRight className="mx-2 h-5 w-5 text-zinc-400" />
                        {crumb.isLast ? (
                            <span>{crumb.name}</span>
                        ) : (
                            <Link href={crumb.url} className="hover:text-zinc-300 transition-colors">
                                {crumb.name}
                            </Link>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
} 