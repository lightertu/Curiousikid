"use client";

import React from 'react';

interface PixelGridProps {
    rows: number;
    cols: number;
    pixelData: string[][]; // 2D array of color strings (e.g., hex codes)
}

const PixelGrid: React.FC<PixelGridProps> = ({ rows, cols, pixelData }) => {

    // Validate pixelData dimensions (optional but good practice)
    if (pixelData.length !== rows || pixelData.some(row => row.length !== cols)) {
        console.error("Pixel data dimensions do not match rows/cols props.");
        // Optionally return null or an error message component
        return <div className="text-red-500">Invalid pixel data dimensions</div>;
    }

    return (
        <div
            className="inline-grid border border-gray-700 bg-black p-1 my-8"
            style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: '2px',
                width: 'fit-content',
            }}
        >
            {/* Iterate over rows and columns from pixelData */}
            {pixelData.flat().map((color, index) => (
                <div
                    key={index}
                    className="w-7 h-7 rounded-sm" // Reduced pixel size (was w-8 h-8)
                    style={{ backgroundColor: color || '#374151' }} // Apply color from data, fallback to gray-700
                ></div>
            ))}
        </div>
    );
};

export default PixelGrid; 