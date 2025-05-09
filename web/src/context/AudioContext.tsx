import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

type AudioContextType = {
    audioRef: React.RefObject<HTMLAudioElement> | null;
    setAudioRef: (ref: React.RefObject<HTMLAudioElement>) => void;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
};

const AudioContext = createContext<AudioContextType>({
    audioRef: null,
    setAudioRef: () => { },
    isPlaying: false,
    play: () => { },
    pause: () => { },
    togglePlay: () => { },
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [audioRef, setAudioRefState] = useState<React.RefObject<HTMLAudioElement> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Register the audio reference from the AudioPlayer component
    const setAudioRef = useCallback((ref: React.RefObject<HTMLAudioElement>) => {
        setAudioRefState(ref);
    }, []);

    // Play the audio
    const play = useCallback(() => {
        if (audioRef?.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        console.log('Audio playback started');
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                    });
            }
        }
    }, [audioRef]);

    // Pause the audio
    const pause = useCallback(() => {
        if (audioRef?.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [audioRef]);

    // Toggle play/pause
    const togglePlay = useCallback(() => {
        if (audioRef?.current) {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
        }
    }, [audioRef, isPlaying, play, pause]);

    // Update isPlaying state when audio plays or pauses
    const handlePlay = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    // Update event listeners when audio ref changes
    React.useEffect(() => {
        const currentAudio = audioRef?.current;

        if (currentAudio) {
            currentAudio.addEventListener('play', handlePlay);
            currentAudio.addEventListener('pause', handlePause);

            return () => {
                currentAudio.removeEventListener('play', handlePlay);
                currentAudio.removeEventListener('pause', handlePause);
            };
        }
    }, [audioRef, handlePlay, handlePause]);

    const value = {
        audioRef,
        setAudioRef,
        isPlaying,
        play,
        pause,
        togglePlay,
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}; 