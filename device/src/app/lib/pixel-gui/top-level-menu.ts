// Define pixel colors
const OFF = '#374151'; // gray-700
const PINK = '#ec4899'; // pink-500
const RED = '#ef4444'; // red-500
const CYAN = '#22d3ee'; // cyan-400
const BLUE_LIGHT = '#60a5fa'; // blue-400
const GREEN = '#4ade80'; // green-400
const BLUE_DARK = '#3b82f6'; // blue-500

// Approximate 16x16 pattern from the image
const pattern16x16: string[][] = [
    [PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, OFF, OFF, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, OFF, OFF, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, RED, RED, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, RED, RED, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, OFF, OFF, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, RED, RED, OFF, OFF, CYAN, CYAN, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, OFF, BLUE_LIGHT, GREEN, BLUE_DARK, PINK],
    [PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK],
    [PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK, PINK]
];

// Embed the 16x16 pattern into a 22x22 grid with padding
export const topLevelMenuData: string[][] = [];
const padding = [OFF, OFF, OFF];

// Top padding rows
for (let i = 0; i < 3; i++) {
    topLevelMenuData.push(Array(22).fill(OFF));
}

// Embed the pattern with side padding
pattern16x16.forEach(row16 => {
    topLevelMenuData.push([...padding, ...row16, ...padding]);
});

// Bottom padding rows
for (let i = 0; i < 3; i++) {
    topLevelMenuData.push(Array(22).fill(OFF));
} 