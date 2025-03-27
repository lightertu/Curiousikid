import React, { useRef, useEffect, useState } from "react";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";

const TrackAudio: React.FC = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { currentStory, stories, setCurrentStory, isPlaying, setIsPlaying, isAIVoiceStreaming } = useGlobalState();
	const { websocketService } = useWebSocket();
	
	// Add this state to track the last sent time
	const [lastSentTime, setLastSentTime] = useState<number>(-1);
	
	// Functions
	const updateTimeHandler = (e: React.SyntheticEvent<HTMLAudioElement>): void => {
		const target = e.target as HTMLAudioElement;
		const currentTime = target.currentTime;
		const duration = target.duration;
		
		if (!currentStory) return;
		// Update local state
		setCurrentStory({ ...currentStory, currentTime, duration });
		// Send update to backend with proper throttling
		const currentSecond = Math.floor(currentTime);
		if (currentSecond % 2 === 0 && currentSecond !== lastSentTime) {
			websocketService.storyProtocol.setStoryProgress({
				type: MessageType.SET_STORY_PROGRESS,
				payload: {
					...currentStory,
					currentTime,
				},
			});
			setLastSentTime(currentSecond);
		}
	};

	const songEndHandler = async (): Promise<void> => {
		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id);
		const nextSong = stories[(currentIndex + 1) % stories.length];
		setCurrentStory({ ...nextSong, currentTime: 0, duration: 0 });
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
			audioRef.current.play()
		} else {
			console.log("Pause");
			audioRef.current.pause();
		}
	}, [isPlaying, isAIVoiceStreaming, setIsPlaying]);

	// Add this useEffect to control the audio timestamp when currentTrack.currentTime changes externally
	useEffect(() => {
		if (!audioRef.current || !currentStory) return;
		
		// Get the current playback time from the audio element
		const audioCurrentTime = audioRef.current.currentTime;
		
		// Check if the currentTrack.currentTime is significantly different from the audio element's time
		// This prevents a loop since updateTimeHandler also updates currentTrack.currentTime
		if (Math.abs(audioCurrentTime - currentStory.currentTime) > 1) {
			console.log(`Seeking to ${currentStory.currentTime}`);
			audioRef.current.currentTime = currentStory.currentTime;
		}
	}, [currentStory]);

	return (
        <audio
            onLoadedMetadata={updateTimeHandler}
            onTimeUpdate={updateTimeHandler}
            onEnded={songEndHandler}
            ref={audioRef}
            src={currentStory?.audioUrl}
        />
	);
};

export default TrackAudio;
