"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to manage pixel animation frames.
 * @param animationData An array of frames, where each frame is a 2D array of color strings.
 * @param fps The desired frames per second for the animation.
 * @returns The current frame's pixel data (2D array of color strings).
 */
export const usePixelAnimation = (animationData: string[][][], fps: number): string[][] => {
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    useEffect(() => {
        // Ensure valid animation data and FPS
        if (!animationData || animationData.length === 0 || fps <= 0) {
            // Return early or handle error state if needed
            console.warn('Invalid animation data or FPS provided to usePixelAnimation.');
            // Reset index if data becomes invalid
            setCurrentFrameIndex(0);
            return;
        }

        // Calculate interval duration based on FPS
        const intervalDuration = 1000 / fps;

        // Set up the interval to switch frames
        const intervalId = setInterval(() => {
            setCurrentFrameIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                // Loop back to the first frame if we've reached the end
                return nextIndex >= animationData.length ? 0 : nextIndex;
            });
        }, intervalDuration);

        // Clean up the interval when the component unmounts or dependencies change
        return () => clearInterval(intervalId);

    }, [animationData, fps]); // Re-run the effect if animationData or fps changes

    // Return the pixel data for the current frame
    // Provide a default empty frame if data is invalid or not ready
    const defaultFrame: string[][] = Array(animationData[0]?.length || 0).fill(Array(animationData[0]?.[0]?.length || 0).fill('#000000'));

    return animationData?.[currentFrameIndex] ?? defaultFrame;
}; 