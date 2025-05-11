"use client";

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

export function LoadingSpinner({ size = 'medium', color = '#10B981' }: LoadingSpinnerProps) {
    const sizeMap = {
        small: 'w-5 h-5',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className="flex justify-center items-center">
            <div
                className={`${sizeMap[size]} animate-spin rounded-full border-2 border-solid border-t-transparent`}
                style={{ borderColor: `${color} transparent transparent transparent` }}
                role="status"
                aria-label="loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
}

export function FullPageLoader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-zinc-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
                <LoadingSpinner size="large" />
                <p className="mt-4 text-white font-medium">Loading podcasts...</p>
            </div>
        </div>
    );
} 