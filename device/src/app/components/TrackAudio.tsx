import React, { useRef, useEffect, useState } from "react";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitConnectionDetails, LiveKitApi } from "../api/livekit";
const TrackAudio: React.FC = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const { 
		currentStory, 
		stories, 
		setCurrentStory, 
		isPlaying, 
		setIsPlaying, 
		isConnectingToLivekit, 
		setIsConnectingToLivekit, 
		setLivekitConnectionDetails,
		livekitConnectionDetails,
		isLivekitRoomConnected
	} = useGlobalState();
	const { websocketService } = useWebSocket();
	
	// Add this state to track the last sent time
	const [lastSentTime, setLastSentTime] = useState<number>(-1);
	
	// Component mount/unmount check
	useEffect(() => {
		console.log("TrackAudio component mounted");
		
		// Test direct subscription to state changes
		const unsubscribe = useGlobalState.subscribe(
			(state) => {
				console.log("Direct subscription detected isPlaying:", state.isPlaying);
			}
		);
		
		return () => {
			console.log("TrackAudio component unmounted");
			unsubscribe();
		};
	}, []);
	
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

		if (currentStory.currentTime > 100 && isPlaying && !isConnectingToLivekit && !isLivekitRoomConnected) {
			setIsConnectingToLivekit(true);
			getLiveKitRoomConnectionDetails().then((connectionDetails) => {
				console.log(`Connected to LiveKit, ${connectionDetails}`);
				setLivekitConnectionDetails(connectionDetails);
			}).catch((error) => {
				setIsConnectingToLivekit(false);
				console.error("Error connecting to LiveKit", error);
			});
		}
	};

	const getLiveKitRoomConnectionDetails = async (): Promise<LiveKitConnectionDetails> => {
		const liveKitApi = new LiveKitApi();
		return await liveKitApi.getConnectionDetails() as LiveKitConnectionDetails;
	}

	const songEndHandler = async (): Promise<void> => {
		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id);
		const nextSong = stories[(currentIndex + 1) % stories.length];
		setCurrentStory({ ...nextSong, currentTime: 0, duration: 0 });
        setIsPlaying(true);
	};

	useEffect(() => {
		console.log("TrackAudio: isPlaying state changed to", isPlaying);
		if (!audioRef.current) {
			console.error("TrackAudio: No audio ref available");
			return;
		}
		
		if (isPlaying) {
			console.log("TrackAudio: Attempting to play audio");
			audioRef.current.play()
				.then(() => {
					console.log("TrackAudio: Audio playback started successfully");
				})
				.catch(error => {
					console.error("TrackAudio: Error starting audio playback", error);
					// This might be triggered by user interaction issues
					setIsPlaying(false);
				});
		} else {
			console.log("TrackAudio: Pausing audio");
			audioRef.current.pause();
		}
	}, [isPlaying, setIsPlaying]);

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
