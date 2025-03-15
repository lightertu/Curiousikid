import React, { useRef, useEffect } from "react";
import useGlobalState from "../GlobalState";


const TrackAudio: React.FC = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { currentTrack, tracks, setCurrentTrack, isPlaying, setIsPlaying } = useGlobalState();
	// Functions
	const updateTimeHandler = (e: React.SyntheticEvent<HTMLAudioElement>): void => {
		const target = e.target as HTMLAudioElement;
		const currentTime = target.currentTime;
		const duration = target.duration;
		setCurrentTrack({ ...currentTrack, currentTime, duration });
	};

	const songEndHandler = async (): Promise<void> => {
		const currentIndex = tracks.findIndex((song) => song.id === currentTrack.id);
		const nextSong = tracks[(currentIndex + 1) % tracks.length];
		setCurrentTrack({ ...currentTrack, id: nextSong.id, duration: 0 });
        setIsPlaying(true);
	};

	// Add this useEffect to control audio playback when isPlaying changes
	useEffect(() => {
		if (!audioRef.current) return;
		
		if (isPlaying) {
            console.log("Playing");
			audioRef.current.play().catch(error => {
				console.error("Audio playback failed:", error);
				setIsPlaying(false); // Revert state if autoplay is blocked
			});
		} else {
            console.log("Pause");
			audioRef.current.pause();
		}
	}, [isPlaying, setIsPlaying]);

	return (
        <audio
            onLoadedMetadata={updateTimeHandler}
            onTimeUpdate={updateTimeHandler}
            onEnded={songEndHandler}
            ref={audioRef}
            src={currentTrack.audio}
        />
	);
};

export default TrackAudio;
