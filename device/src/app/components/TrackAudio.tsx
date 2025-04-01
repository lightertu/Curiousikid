import React, { useRef, useEffect, useState, useCallback } from "react";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitConnectionDetails, LiveKitApi } from "../api/livekit";

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
		isLivekitRoomConnected
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

	// --- Time Update Logic ---
	const updatePlaybackTime = useCallback(() => {
		if (!audioContext.current || !currentStory || !audioSource.current || !isPlaying) return;
		
		const currentTime = getCurrentTime();
		
		if (Math.abs(currentTime - currentStory.currentTime) > 0.1) {
			setCurrentStory({ 
				...currentStory,
				currentTime,
				duration: audioDuration.current
			});
			
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
		}
		
		if (currentTime > 100 && isPlaying && !isConnectingToLivekit && !isLivekitRoomConnected) {
			setIsConnectingToLivekit(true);
			getLiveKitRoomConnectionDetails().then((connectionDetails) => {
				console.log(`Connected to LiveKit, ${connectionDetails}`);
				setLivekitConnectionDetails(connectionDetails);
			}).catch((error) => {
				setIsConnectingToLivekit(false);
				console.error("Error connecting to LiveKit", error);
			});
		}
		
		if (currentTime >= audioDuration.current - 0.1 && audioDuration.current > 0) {
			handleSongEnd();
		}
	}, [currentStory, isPlaying, isConnectingToLivekit, isLivekitRoomConnected, lastSentTime, setCurrentStory, setIsPlaying, setIsConnectingToLivekit, setLivekitConnectionDetails, websocketService]);

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
	const getLiveKitRoomConnectionDetails = async (): Promise<LiveKitConnectionDetails> => {
		const liveKitApi = new LiveKitApi();
		return await liveKitApi.getConnectionDetails() as LiveKitConnectionDetails;
	};

	// --- Handle Song End ---
	const handleSongEnd = useCallback(() => {
		console.log("Song ended, moving to next track");
		
		stopPlayback();
		
		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id);
		const nextSong = stories[(currentIndex + 1) % stories.length];
		
		setCurrentStory({ ...nextSong, currentTime: 0, duration: 0 });
		playbackPosition.current = 0;
		
		setIsPlaying(true);
	}, [stories, currentStory?.id, setCurrentStory, setIsPlaying]);

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
		timeUpdateInterval.current = window.setInterval(updatePlaybackTime, 100);
		
		source.onended = () => {
			if (audioSource.current === source) {
				handleSongEnd();
			}
		};
	}, [handleSongEnd, updatePlaybackTime]);

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
	}, []);

	// --- Play/Pause State Change Handler ---
	useEffect(() => {
		console.log("TrackAudio: Global isPlaying state changed to", isPlaying);
		
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
