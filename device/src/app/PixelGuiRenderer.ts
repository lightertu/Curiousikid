import { AnyEventObject, AssignArgs, EventObject, MetaObject, ProvidedActor } from "xstate";
import { NonReducibleUnknown } from "xstate";
import { StateValue } from "xstate";
import { AnyActorRef } from "xstate";
import { MachineSnapshot } from "xstate";
import { DeviceContext } from "./DeviceStateMachine";
import { musicNoteData } from "./lib/pixel-gui/music-note";
import { smileyData } from "./lib/pixel-gui/smiley";
import { BLANK_SCREEN } from "./lib/pixel-gui/blank";
import { STORY_MENU } from "./lib/pixel-gui/story";
import { PLAY_ICON, PAUSE_ICON } from "./lib/pixel-gui/playback_icon";

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
    const stories = context.stories;
    const currentStory = context.currentStory;
    const topMenuHighlightedIndex = context.topMenuHighlightedIndex;

    return []
}

export const renderPlayback = (context: DeviceContext): string[][] => {
    const currentStory = context.currentStory;
    const isStoryPlaying = context.isStoryPlaying;
    const isProactiveQuestionActive = context.isProactiveQuestionActive;
    const isUserQuestionActive = context.isUserQuestionActive;

    if (isStoryPlaying) {
        return PAUSE_ICON;
    } else {
        return PLAY_ICON;
    }
}
