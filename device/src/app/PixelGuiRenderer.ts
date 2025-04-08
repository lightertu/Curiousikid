import { AnyEventObject, AssignArgs, EventObject, MetaObject, ProvidedActor } from "xstate";
import { NonReducibleUnknown } from "xstate";
import { StateValue } from "xstate";
import { AnyActorRef } from "xstate";
import { MachineSnapshot } from "xstate";
import { DeviceContext } from "./DeviceStateMachine";
import { musicNoteData } from "./lib/pixel-gui/music-note";
import { smileyData } from "./lib/pixel-gui/smiley";
import { BLANK_SCREEN } from "./lib/pixel-gui/blank";

export const renderTopMenu = (context: DeviceContext): string[][] => {
    const topMenuHighlightedIndex = context.topMenuHighlightedIndex;

    if (topMenuHighlightedIndex === 0) {
        console.log("renderMusicNote");
        return musicNoteData;
    } else if (topMenuHighlightedIndex === 1) {
        console.log("renderSmiley");
        return smileyData;
    } else {
        console.log("renderBlank");
        return BLANK_SCREEN;
    }
}