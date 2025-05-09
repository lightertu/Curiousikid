import { createSlice } from "@reduxjs/toolkit";
import { Episode } from "../types/podcast";

interface AudioPlayerState {
    openPlayer: boolean;
    type: string;
    episode: Episode | null;
    podid: string | null;
    currenttime: number;
    index: number;
}

const initialState: AudioPlayerState = {
    openPlayer: false,
    type: "audio",
    episode: null,
    podid: null,
    currenttime: 0,
    index: 0
};

const audioplayer = createSlice({
    name: 'audioplayer',
    initialState,
    reducers: {
        openPlayer: (state, action) => {
            state.openPlayer = true;
            state.type = action.payload.type;
            state.episode = action.payload.episode;
            state.podid = action.payload.podid;
            state.currenttime = action.payload.currenttime;
            state.index = action.payload.index;
        },
        closePlayer: (state) => {
            state.openPlayer = false;
        },
        setCurrentTime: (state, action) => {
            state.currenttime = action.payload.currenttime;
        }
    }
});

export const { openPlayer, closePlayer, setCurrentTime } = audioplayer.actions;

export default audioplayer.reducer;