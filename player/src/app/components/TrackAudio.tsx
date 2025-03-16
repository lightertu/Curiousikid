import React, { useRef, useEffect, useState } from "react";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";

const TrackAudio: React.FC = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { currentTrack, tracks, setCurrentTrack, isPlaying, setIsPlaying, isAIVoiceStreaming } = useGlobalState();
	const { sendTrackContextUpdate } = useWebSocket();
	
	// Add this state to track the last sent time
	const [lastSentTime, setLastSentTime] = useState<number>(-1);
	
	// Functions
	const updateTimeHandler = (e: React.SyntheticEvent<HTMLAudioElement>): void => {
		const target = e.target as HTMLAudioElement;
		const currentTime = target.currentTime;
		const duration = target.duration;
		
		// Update local state
		setCurrentTrack({ ...currentTrack, currentTime, duration });
		
		// Send update to backend with proper throttling
		const currentSecond = Math.floor(currentTime);
		if (currentSecond % 2 === 0 && currentSecond !== lastSentTime) {
			sendTrackContextUpdate(
				currentTrack.id,
				duration,
				currentTime
			);
			setLastSentTime(currentSecond);
		}
	};

	const songEndHandler = async (): Promise<void> => {
		const currentIndex = tracks.findIndex((song) => song.id === currentTrack.id);
		const nextSong = tracks[(currentIndex + 1) % tracks.length];
		setCurrentTrack({ ...currentTrack, id: nextSong.id, duration: 0 });
        setIsPlaying(true);
	};

	// Add this useEffect to control audio playback when isPlaying or isAIVoiceStreaming changes
	useEffect(() => {
		if (!audioRef.current) return;
		
		// If AI voice is streaming, pause the audio regardless of isPlaying state
		if (isAIVoiceStreaming) {
			console.log("Pausing audio for AI voice");
			setIsPlaying(false);
			audioRef.current.pause();
			return;
		}
		
		// Normal playback control when AI isn't speaking
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
	}, [isPlaying, isAIVoiceStreaming, setIsPlaying]);

	// Add this useEffect to control the audio timestamp when currentTrack.currentTime changes externally
	useEffect(() => {
		if (!audioRef.current || !currentTrack) return;
		
		// Get the current playback time from the audio element
		const audioCurrentTime = audioRef.current.currentTime;
		
		// Check if the currentTrack.currentTime is significantly different from the audio element's time
		// This prevents a loop since updateTimeHandler also updates currentTrack.currentTime
		if (Math.abs(audioCurrentTime - currentTrack.currentTime) > 1) {
			console.log(`Seeking to ${currentTrack.currentTime}`);
			audioRef.current.currentTime = currentTrack.currentTime;
		}
	}, [currentTrack]);

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
