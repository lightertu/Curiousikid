import { create } from 'zustand';
import { Track } from './data';
import { v4 as uuidv4 } from 'uuid';

interface CurrentTrack extends Track {
    currentTime: number;
    duration: number;
}

interface GlobalState {
  isPlaying: boolean;
  tracks: Track[];
  currentTrack: CurrentTrack;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (currentTrack: CurrentTrack) => void;
  setTracks: (tracks: Track[]) => void;
  libraryStatus: boolean;
  setLibraryStatus: (libraryStatus: boolean) => void;
}

const ALL_TRACKS = [
    {
        name: "Birdy on the Ski Slopes",
        cover: "https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?",
        artist: "Storynory",
        audio: "/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
        id: uuidv4(),
    },
]

const useGlobalState = create<GlobalState>((set) => ({
    isPlaying: false, // Initial music state 
    libraryStatus: false,
    tracks: ALL_TRACKS, 
    currentTrack: { 
        ...ALL_TRACKS[0],
        currentTime: 0,
        duration: 0,
    }, 
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }), 
    setCurrentTrack: (currentTrack: CurrentTrack) => set({ currentTrack }),
    setTracks: (tracks: Track[]) => set({ tracks }),
    setLibraryStatus: (libraryStatus: boolean) => set({ libraryStatus }),
}));

export default useGlobalState;
