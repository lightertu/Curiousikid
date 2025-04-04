import React, { useRef, useEffect, useState, useCallback } from "react";
import useGlobalState, { QuestionPoint } from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitConnectionDetails, LiveKitApi, ConnectionMetadata } from "../api/livekit";

const TrackAudio: React.FC = () => {
	// --- Refs for Web Audio API objects ---
	const audioContext = useRef<AudioContext | null>(null);
	const audioSource = useRef<AudioBufferSourceNode | null>(null);
	const gainNode = useRef<GainNode | null>(null);

	// --- Refs for managing playback state ---
	const playbackPosition = useRef<number>(0);
	const playbackStartTime = useRef<number>(0);
	const audioDuration = useRef<number>(0);
	const timeUpdateInterval = useRef<number | null>(null);
	const audioBuffer = useRef<AudioBuffer | null>(null);
	const isLoading = useRef<boolean>(false);

	// --- Global State ---
	const { 
		currentStory,
		stories,
		setCurrentStory,
		isPlaying,
		setIsPlaying,
		isConnectingToLivekit,
		setIsConnectingToLivekit,
		setLivekitConnectionDetails,
		isLivekitRoomConnected,
		questionPoint,
		livekitConnectionDetails
	} = useGlobalState();
	const { websocketService } = useWebSocket();

	// --- Local State ---
	const [lastSentTime, setLastSentTime] = useState<number>(-1);

	// --- Component Lifecycle: Mount & Unmount ---
	useEffect(() => {
		console.log("TrackAudio component mounted");
		
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		audioContext.current = new AudioContextClass();
		
		gainNode.current = audioContext.current.createGain();
		gainNode.current.connect(audioContext.current.destination);
		
		const unsubscribe = useGlobalState.subscribe(
			(state) => {
				console.log("Direct subscription detected isPlaying:", state.isPlaying);
			}
		);
		
		return () => {
			console.log("TrackAudio component unmounted");
			
			stopPlayback();
			if (timeUpdateInterval.current) {
				window.clearInterval(timeUpdateInterval.current);
			}
			
			if (audioContext.current && audioContext.current.state !== 'closed') {
				audioContext.current.close();
			}
			
			unsubscribe();
		};
	}, []);

	// --- Audio Loading ---
	useEffect(() => {
		if (!currentStory?.audioUrl || !audioContext.current || isLoading.current) return;
		
		const loadAudio = async () => {
			try {
				isLoading.current = true;
				console.log(`Loading audio from ${currentStory.audioUrl}`);
				
				const response = await fetch(currentStory.audioUrl);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const arrayBuffer = await response.arrayBuffer();
				
				if (!audioContext.current) return;
				const buffer = await audioContext.current.decodeAudioData(arrayBuffer);
				
				audioBuffer.current = buffer;
				audioDuration.current = buffer.duration;
				playbackPosition.current = 0;
				
				console.log(`Audio loaded, duration: ${buffer.duration.toFixed(2)}s`);
				
				setCurrentStory({ 
					...currentStory,
					currentTime: 0,
					duration: buffer.duration
				});
				
				if (isPlaying) {
					startPlayback();
				}
				
				isLoading.current = false;
			} catch (error) {
				console.error("Error loading or decoding audio:", error);
				isLoading.current = false;
				setIsPlaying(false);
			}
		};
		
		stopPlayback();
		loadAudio();
	}, [currentStory?.audioUrl, setCurrentStory, setIsPlaying]);

	// --- Stop Playback ---
	const stopPlayback = useCallback(() => { 
		console.log("Stopping playback"); 
		
		if (timeUpdateInterval.current) { 
			window.clearInterval(timeUpdateInterval.current); 
			timeUpdateInterval.current = null; 
		}
		
		if (audioSource.current) { 
			try {
				playbackPosition.current = getCurrentTime(); 
				
				audioSource.current.stop(0); 
				audioSource.current.disconnect(); 
				audioSource.current = null; 
			} catch (e) {
				console.error("Error stopping playback source:", e); 
				audioSource.current = null; 
			}
		}
	}, []); // No state/prop dependencies needed here

	// --- Handle Song End ---
	const handleSongEnd = useCallback(() => { 
		console.log("Song ended, moving to next track"); 
		
		stopPlayback(); // Now stopPlayback is defined above
		
		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id); 
		const nextSong = stories[(currentIndex + 1) % stories.length]; 
		
		setCurrentStory({ ...nextSong, currentTime: 0, duration: 0 }); 
		playbackPosition.current = 0; 
		
		setIsPlaying(true); 
	}, [stories, currentStory?.id, setCurrentStory, setIsPlaying, stopPlayback]); // Keep stopPlayback dependency

	// --- Time Update Logic ---
	const updatePlaybackTime = useCallback(() => { 
		// Exit if context or story is missing, or not currently playing
		if (!audioContext.current || !currentStory || !audioSource.current || !isPlaying) return; 
		
		// --- Calculate Current Time ---
		// Get the precise current playback time
		const currentTime = getCurrentTime(); 
		// Get the latest lastSentTime from state (needed for comparison)
		const currentLastSentTime = lastSentTime; 
		
		// --- Update Global State & Send WS Message (Throttled) ---
		// Check if the difference exceeds the 2-second threshold
		if (Math.abs(currentTime - currentLastSentTime) > 2) { 
			// Log the update trigger
			console.log(`[TrackAudio Update] Updating state & sending WS message. Diff: ${(currentTime - currentLastSentTime).toFixed(2)}s`);
			// Log the current time and last sent time before update
			console.log("[TrackAudio Update] currentTime before update:", currentTime); 
			console.log("[TrackAudio Update] lastSentTime before update:", currentLastSentTime); 
			// Update the global state with the new time and duration
			setCurrentStory({ 
				...currentStory, // Keep existing properties
				currentTime, // Update current time
				duration: audioDuration.current // Ensure duration is up-to-date
			});
			
			// Send the progress update via WebSocket
			websocketService.storyProtocol.setStoryProgress({ 
				type: MessageType.SET_STORY_PROGRESS, // Message type
				payload: { // Message payload
					...currentStory, // Include story details
					currentTime, // Include current time
				},
			});
			// Update the last sent time state with the precise current time
			// Use functional update to ensure we're updating based on the latest state
			setLastSentTime(currentTime); 
			// Log the last sent time after update
			console.log("[TrackAudio Update] lastSentTime after update:", currentTime); 
		} 
		
		// --- LiveKit Connection Trigger ---
		// Check if conditions are met to initiate LiveKit connection
		// Log values used in LiveKit check
		// Check if at a question point
		const isAtQuestionPoint = questionPoint && currentTime >= questionPoint.connectAt && currentTime - questionPoint.connectAt <= 1; 
		// Check if LiveKit is not already connected or connecting
		const canConnectToLiveKit = !isConnectingToLivekit && !isLivekitRoomConnected && !livekitConnectionDetails; 
		// If conditions met, initiate connection
		if (isAtQuestionPoint && isPlaying && canConnectToLiveKit) { 
			// Log the trigger
			console.log("[TrackAudio LiveKit Trigger] Conditions met, initiating connection.");
			// Set connecting state
			setIsConnectingToLivekit(true); 
			// Fetch LiveKit connection details
			getLiveKitRoomConnectionDetails({
				questionPoint: questionPoint,
				userId: questionPoint.userId
			}).then((connectionDetails) => { 
				// Log success and set details
				console.log(`[TrackAudio LiveKit Trigger] Connected to LiveKit, ${connectionDetails}`); 
				setLivekitConnectionDetails(connectionDetails); 
			}).catch((error) => { // Handle errors
				// Reset connecting state on error
				setIsConnectingToLivekit(false); 
				// Log the error
				console.error("[TrackAudio LiveKit Trigger] Error connecting to LiveKit", error); 
			});
		} 
		// Log if conditions were not met
		// else if (isAtQuestionPoint || isPlaying || canConnectToLiveKit) { 
		// 	console.log(`[TrackAudio LiveKit Check] Conditions not met. isAtQP: ${isAtQuestionPoint}, isPlaying: ${isPlaying}, canConnect: ${canConnectToLiveKit}`);
		// }
		
		// --- Check for End of Track ---
		if (currentTime >= audioDuration.current - 0.1 && audioDuration.current > 0) { 
			console.log("[TrackAudio Update] Detected end of track.");
			handleSongEnd(); // handleSongEnd is defined above now
		}
	// Dependencies without handleSongEnd
	}, [currentStory, 
		isPlaying, 
		isConnectingToLivekit, 
		isLivekitRoomConnected, 
		setCurrentStory, 
		setIsPlaying, 
		setIsConnectingToLivekit, 
		setLivekitConnectionDetails, 
		websocketService, 
		questionPoint, 
		livekitConnectionDetails
	]);

	// --- Get Current Time ---
	const getCurrentTime = (): number => {
		if (!audioContext.current || !isPlaying || !audioSource.current) {
			return playbackPosition.current;
		}
		
		const elapsed = audioContext.current.currentTime - playbackStartTime.current;
		const currentTime = playbackPosition.current + elapsed;
		
		return Math.min(currentTime, audioDuration.current);
	};

	// --- Get LiveKit Connection Details ---
	const getLiveKitRoomConnectionDetails = async (metadata: ConnectionMetadata): Promise<LiveKitConnectionDetails> => {
		const liveKitApi = new LiveKitApi();
		return await liveKitApi.getConnectionDetails(metadata) as LiveKitConnectionDetails;
	};

	// --- Ref for Interval Callback ---
	const updatePlaybackTimeRef = useRef(updatePlaybackTime);
	useEffect(() => {
		updatePlaybackTimeRef.current = updatePlaybackTime;
	}, [updatePlaybackTime]);

	// --- Start Playback ---
	const startPlayback = useCallback(() => {
		if (!audioContext.current || !audioBuffer.current || !gainNode.current) {
			console.error("Cannot start playback - audio context, buffer, or gain node not ready.");
			return;
		}
		
		if (audioContext.current.state === 'suspended') {
			audioContext.current.resume().catch(err => console.error("Error resuming audio context:", err));
		}
		
		const source = audioContext.current.createBufferSource();
		source.buffer = audioBuffer.current;
		source.connect(gainNode.current);
		
		console.log(`Starting playback from ${playbackPosition.current.toFixed(2)}s`);
		source.start(0, playbackPosition.current);
		
		audioSource.current = source;
		playbackStartTime.current = audioContext.current.currentTime;
		
		if (timeUpdateInterval.current) {
			window.clearInterval(timeUpdateInterval.current);
		}
		// Use the ref to the latest callback in setInterval
		timeUpdateInterval.current = window.setInterval(() => updatePlaybackTimeRef.current(), 100); 
		
		source.onended = () => {
			if (audioSource.current === source) {
				handleSongEnd(); // handleSongEnd is defined above now
			}
		};
	}, [handleSongEnd]); // Keep handleSongEnd dependency

	// --- Play/Pause State Change Handler ---
	useEffect(() => {
		if (isPlaying) {
			if (!audioSource.current && audioBuffer.current) {
				console.log("TrackAudio: Attempting to play audio");
				startPlayback();
			}
		} else {
			console.log("TrackAudio: Pausing audio");
			stopPlayback();
		}
	}, [isPlaying, startPlayback, stopPlayback]);

	// --- Seeking Handler ---
	useEffect(() => {
		if (!audioContext.current || !audioBuffer.current || !currentStory) return;
		
		const internalTime = getCurrentTime();
		
		if (Math.abs(internalTime - currentStory.currentTime) > 1) {
			console.log(`Seeking detected: target time ${currentStory.currentTime.toFixed(2)}s`);
			
			playbackPosition.current = currentStory.currentTime;
			
			if (isPlaying && audioSource.current) {
				console.log("Restarting playback from seek position");
				stopPlayback();
				startPlayback();
			}
		}
	}, [currentStory?.currentTime, isPlaying, startPlayback, stopPlayback]);

	return null;
};

export default TrackAudio;
