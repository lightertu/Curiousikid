// device/src/app/lib/pixel-gui/forward-playback.ts

import { GREEN, OFF } from "./colors";

// Define pixel colors
const PROGRESS_BG = '#D3D3D3';   // Progress bar background
const PROGRESS_FILL = '#A9A9A9'; // Progress bar fill color

const GRID_SIZE = 32;

/**
 * Generates a 32x32 pixel art array for a forward playback screen.
 *
 * @param progress - The progress percentage (0-100).
 * @returns A 32x32 array of hex color strings.
 */
export const generateForwardPlaybackScreen = (progress: number): string[][] => {
    // Ensure progress is between 0 and 100
    console.log("progress", progress);
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Initialize grid with background color
    const grid: string[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(OFF));

    // --- Draw the Forward Icon (two green triangles) ---
    // Triangle 1 (smaller, left) - Centered
    for (let y = 11; y <= 17; y++) {
        const halfHeight = 3;
        const width = y <= 14 ? (y - 11) : (17 - y); // Triangle width for this row
        const startX = 10; // Shifted +2 from 8
        for (let x = startX; x <= startX + width; x++) {
            if (x < GRID_SIZE) { // Boundary check
                grid[y][x] = GREEN;
            }
        }
    }

    // Triangle 2 (larger, right) - Centered
    for (let y = 9; y <= 19; y++) {
        const halfHeight = 5;
        const width = y <= 14 ? (y - 9) : (19 - y); // Triangle width for this row
        const startX = 15; // Shifted +2 from 13
        for (let x = startX; x <= startX + width; x++) {
            if (x < GRID_SIZE) { // Boundary check
                grid[y][x] = GREEN;
            }
        }
    }


    // --- Draw the Progress Bar ---
    const barYStart = 25;
    const barYEnd = 27;
    const barXStart = 4;
    const barXEnd = 27; // Inclusive end column index
    const barWidth = barXEnd - barXStart + 1; // Total width of the bar area = 24

    // Calculate filled width
    const filledWidth = Math.round(barWidth * (clampedProgress / 100));

    for (let y = barYStart; y <= barYEnd; y++) {
        for (let x = barXStart; x <= barXEnd; x++) {
            // Fill the background first
            grid[y][x] = PROGRESS_BG;
            // Overlay the filled portion
            if (x < barXStart + filledWidth) {
                grid[y][x] = PROGRESS_FILL;
            }
        }
    }

    return grid;
};

// Example usage (optional - can be removed or used for testing)
// const screenData = generateForwardPlaybackScreen(75); // Generate screen for 75% progress
// console.log(screenData);

/**
 * Generates a 32x32 pixel art array for a backward playback screen.
 *
 * @param progress - The progress percentage (0-100).
 * @returns A 32x32 array of hex color strings.
 */
export const generateBackwardPlaybackScreen = (progress: number): string[][] => {
    // Ensure progress is between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Initialize grid with background color
    const grid: string[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(OFF));

    // --- Draw the Backward Icon (two green triangles pointing left) ---
    // Triangle 2 (larger, now on the left) - Centered
    for (let y = 9; y <= 19; y++) {
        const halfHeight = 5;
        const width = y <= 14 ? (y - 9) : (19 - y); // Triangle width for this row
        const endX = 16; // Peak is now on the left side of center
        for (let x = endX - width; x <= endX; x++) {
            if (x >= 0 && x < GRID_SIZE) { // Boundary check
                grid[y][x] = GREEN;
            }
        }
    }

    // Triangle 1 (smaller, now on the right) - Centered
    for (let y = 11; y <= 17; y++) {
        const halfHeight = 3;
        const width = y <= 14 ? (y - 11) : (17 - y); // Triangle width for this row
        const endX = 21; // Peak is now on the right side of center
        for (let x = endX - width; x <= endX; x++) {
            if (x >= 0 && x < GRID_SIZE) { // Boundary check
                grid[y][x] = GREEN;
            }
        }
    }

    // --- Draw the Progress Bar (Same as forward) ---
    const barYStart = 25;
    const barYEnd = 27;
    const barXStart = 4;
    const barXEnd = 27; // Inclusive end column index
    const barWidth = barXEnd - barXStart + 1; // Total width of the bar area = 24

    // Calculate filled width
    const filledWidth = Math.round(barWidth * (clampedProgress / 100));

    for (let y = barYStart; y <= barYEnd; y++) {
        for (let x = barXStart; x <= barXEnd; x++) {
            // Fill the background first
            grid[y][x] = PROGRESS_BG;
            // Overlay the filled portion
            if (x < barXStart + filledWidth) {
                grid[y][x] = PROGRESS_FILL;
            }
        }
    }

    return grid;
};
