import React, { useRef, useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitConnectionDetails, LiveKitApi, ProactiveQuestionConnectionMetadata } from "../api/livekit";
import { useSelector } from "@xstate/react";
import { CurrentStory, DEVICE_STATE_MACHINE_ACTOR, DeviceEventType } from "../DeviceStateMachine";

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
	const deviceStateMachine = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
		return {
			value: state.value,
			context: state.context
		}
	});

	const {
		currentStory,
		stories,
		isStoryPlaying,
		isConnectingToLivekit,
		isLivekitRoomConnected,
		isProactiveQuestionActive,
		isUserQuestionActive,
		proactiveQuestionPoint,
		livekitConnectionDetails,
		userId } = deviceStateMachine.context;

	const sendSetCurrentStoryEvent = (currentStory: CurrentStory) => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.SET_CURRENT_STORY, payload: { currentStory }
		});
	}

	const sendStopPlaybackEvent = () => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.STOP_PLAYBACK
		});
	}

	const sendStartPlaybackEvent = () => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.START_PLAYBACK
		});
	}

	const sendSetIsConnectingToLivekitEvent = (isConnectingToLivekit: boolean) => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.SET_IS_CONNECTING_TO_LIVEKIT, payload: { isConnectingToLivekit }
		});
	}

	const sendSetLivekitConnectionDetailsEvent = (livekitConnectionDetails: LiveKitConnectionDetails) => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.SET_LIVEKIT_CONNECTION_DETAILS, payload: { livekitConnectionDetails }
		});
	}

	const sendSetLivekitRoomConnectedEvent = (isLivekitRoomConnected: boolean) => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.SET_LIVEKIT_ROOM_CONNECTED, payload: { isLivekitRoomConnected }
		});
	}

	const { websocketService } = useWebSocket();

	// --- Local State ---
	const [lastSentTime, setLastSentTime] = useState<number>(-1);

	// --- Component Lifecycle: Mount & Unmount ---
	useEffect(() => {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		audioContext.current = new AudioContextClass();

		gainNode.current = audioContext.current.createGain();
		gainNode.current.connect(audioContext.current.destination);

		return () => {
			sendStopPlaybackEvent();
			if (timeUpdateInterval.current) {
				window.clearInterval(timeUpdateInterval.current);
			}

			if (audioContext.current && audioContext.current.state !== 'closed') {
				audioContext.current.close();
			}
		};
	}, []);

	// --- Audio Loading ---
	useEffect(() => {
		if (!currentStory?.audioUrl || !audioContext.current || isLoading.current) return;

		const loadAudio = async () => {
			try {
				isLoading.current = true;

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

				DEVICE_STATE_MACHINE_ACTOR.send({
					type: DeviceEventType.SET_CURRENT_STORY, payload: {
						currentStory: {
							...currentStory,
							duration: buffer.duration

						}
					}
				});

				if (isStoryPlaying) {
					startPlayback();
				}

				isLoading.current = false;
			} catch (error) {
				console.error("Error loading or decoding audio:", error);
				isLoading.current = false;
				DEVICE_STATE_MACHINE_ACTOR.send({
					type: DeviceEventType.STOP_PLAYBACK
				});
			}
		};

		stopPlayback();
		loadAudio();
	}, [currentStory?.audioUrl]);

	// --- Stop Playback ---
	const stopPlayback = useCallback(() => {
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
		stopPlayback(); // Now stopPlayback is defined above

		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id);
		const nextSong = stories[(currentIndex + 1) % stories.length];

		sendSetCurrentStoryEvent({ ...nextSong, currentTime: 0, duration: 0 });
		playbackPosition.current = 0;

		sendStartPlaybackEvent();
	}, [stories, currentStory?.id, sendSetCurrentStoryEvent, sendStopPlaybackEvent]); // Keep stopPlayback dependency

	// --- Time Update Logic ---
	const updatePlaybackTime = useCallback(() => {
		// Exit if context or story is missing, or not currently playing
		if (!audioContext.current || !currentStory || !audioSource.current || !isStoryPlaying) return;

		// --- Calculate Current Time ---
		// Get the precise current playback time
		const currentTime = getCurrentTime();
		// console.log("updatePlaybackTime", currentTime);
		sendSetCurrentStoryEvent({
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

		// --- LiveKit Connection Trigger ---
		// Check if conditions are met to initiate LiveKit connection
		// Log values used in LiveKit check
		// Check if at a question point
		const isAtProactiveQuestionPoint = proactiveQuestionPoint && currentTime >= proactiveQuestionPoint.connectAt && currentTime - proactiveQuestionPoint.connectAt <= 1;
		// Check if LiveKit is not already connected or connecting
		const canConnectToLiveKit = !isConnectingToLivekit && !isLivekitRoomConnected && !livekitConnectionDetails;
		// If conditions met, initiate connection
		if (isAtProactiveQuestionPoint && isStoryPlaying && canConnectToLiveKit && !isUserQuestionActive) {
			// Set connecting state
			sendSetIsConnectingToLivekitEvent(true);
			// Fetch LiveKit connection details
			getLiveKitRoomConnectionDetails({
				metadata: proactiveQuestionPoint,
				agentType: "proactive_question",
				userId: userId
			}).then((connectionDetails) => {
				sendSetLivekitConnectionDetailsEvent(connectionDetails);
			}).catch((error) => { // Handle errors
				// Reset connecting state on error
				sendSetIsConnectingToLivekitEvent(false);
				// Log the error
				console.error("[TrackAudio LiveKit Trigger] Error connecting to LiveKit", error);
			});
		}
		// Log if conditions were not met
		// else if (isAtProactiveQuestionPoint || isStoryPlaying || canConnectToLiveKit) { 
		// 	console.log(`[TrackAudio LiveKit Check] Conditions not met. isAtQP: ${isAtProactiveQuestionPoint}, isStoryPlaying: ${isStoryPlaying}, canConnect: ${canConnectToLiveKit}`);
		// }

		// --- Check for End of Track ---
		if (currentTime >= audioDuration.current - 0.1 && audioDuration.current > 0) {
			handleSongEnd(); // handleSongEnd is defined above now
		}
		// Dependencies without handleSongEnd
	}, [currentStory,
		isStoryPlaying,
		isConnectingToLivekit,
		isLivekitRoomConnected,
		sendSetCurrentStoryEvent,
		websocketService,
		proactiveQuestionPoint,
		livekitConnectionDetails,
		userId
	]);

	// --- Get Current Time ---
	const getCurrentTime = (): number => {
		if (!audioContext.current || !isStoryPlaying || !audioSource.current) {
			return playbackPosition.current;
		}

		const elapsed = audioContext.current.currentTime - playbackStartTime.current;
		const currentTime = playbackPosition.current + elapsed;

		return Math.min(currentTime, audioDuration.current);
	};

	// --- Get LiveKit Connection Details ---
	const getLiveKitRoomConnectionDetails = async (metadata: ProactiveQuestionConnectionMetadata): Promise<LiveKitConnectionDetails> => {
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
		if (isStoryPlaying) {
			if (!audioSource.current && audioBuffer.current) {
				startPlayback();
			}
		} else {
			stopPlayback();
		}
	}, [isStoryPlaying, startPlayback, stopPlayback]);

	// --- Seeking Handler ---
	useEffect(() => {
		if (!audioContext.current || !audioBuffer.current || !currentStory) return;

		const internalTime = getCurrentTime();

		if (Math.abs(internalTime - currentStory.currentTime) > 1) {

			playbackPosition.current = currentStory.currentTime;

			if (isStoryPlaying && audioSource.current) {
				stopPlayback();
				startPlayback();
			}
		}
	}, [currentStory?.currentTime, isStoryPlaying, startPlayback, stopPlayback]);

	return null;
};

export default TrackAudio;
