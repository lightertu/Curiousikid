import { DeviceContext } from "./DeviceStateMachine";
import { smileyData } from "./lib/pixel-gui/smiley";
import { BLANK_SCREEN } from "./lib/pixel-gui/blank";
import { STORY_MENU } from "./lib/pixel-gui/story";
import { PLAY_ICON, PAUSE_ICON } from "./lib/pixel-gui/playback_icon";
import { generateForwardPlaybackScreen, generateBackwardPlaybackScreen } from "./lib/pixel-gui/playback-control";

export const renderTopMenu = (context: DeviceContext): string[][] => {
    const topMenuHighlightedIndex = context.topMenuHighlightedIndex;

    if (topMenuHighlightedIndex === 0) {
        console.log("renderMusicNote");
        return STORY_MENU;
    } else if (topMenuHighlightedIndex === 1) {
        console.log("renderSmiley");
        return smileyData;
    } else {
        console.log("renderBlank");
        return BLANK_SCREEN;
    }
}

export const renderStoryMenu = (context: DeviceContext): string[][] => {

    return []
}

export const renderPlayback = (context: DeviceContext): string[][] => {
    const isStoryPlaying = context.isStoryPlaying;

    if (isStoryPlaying) {
        return PAUSE_ICON;
    } else {
        return PLAY_ICON;
    }
}

export const renderForwardPlayback = (context: DeviceContext): string[][] => {
    const currentStory = context.currentStory;
    const progress = (currentStory?.currentTime || 0) / (currentStory?.duration || 1) * 100;
    return generateForwardPlaybackScreen(progress);
}

export const renderBackwardPlayback = (context: DeviceContext): string[][] => {
    const currentStory = context.currentStory;
    const progress = (currentStory?.currentTime || 0) / (currentStory?.duration || 1) * 100;
    return generateBackwardPlaybackScreen(progress);
}
export const renderStoryCover = (context: DeviceContext): string[][] => {
    const pixelArtCover = context.stories[context.selectedStoryIndex].pixelArtCover;
    return pixelArtCover || [];
}

export const renderCharacterCover = (context: DeviceContext): string[][] => {
    const pixelArtCover = context.characters[context.selectedCharacterIndex].pixelArtCover;
    return pixelArtCover || [];
}