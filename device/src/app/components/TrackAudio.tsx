import React, { useRef, useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitConnectionDetails, LiveKitApi, ProactiveQuestionConnectionMetadata } from "../api/livekit";
import { useSelector } from "@xstate/react";
import { CurrentStory, DEVICE_STATE_MACHINE_ACTOR, DeviceEventType, VoiceAgentModel } from "../DeviceStateMachine";

const SET_PROGRESS_INTERVAL_IN_MS = 2000;


const TrackAudio: React.FC = () => {
	// Ref for the <audio> element
	const audioElementRef = useRef<HTMLAudioElement | null>(null);
	// State to hold the duration once loaded
	const [internalDuration, setInternalDuration] = useState<number>(0);
	// Track loading state specifically for the audio element
	const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

	// Ref to track the last time progress was updated
	const lastUpdateTime = useRef<number>(0);

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
		isLivekitRoomConnected,
		isUserQuestionActive,
		proactiveQuestionPoint,
		livekitConnectionDetails,
		isConnectingToLivekit,
		userId
	} = deviceStateMachine.context;

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


	const sendSetAgentModelEvent = (agentModel: VoiceAgentModel) => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.SET_AGENT_MODEL, payload: { agentModel }
		});
	}

	const sendStartProactiveQuestionSessionEvent = () => {
		DEVICE_STATE_MACHINE_ACTOR.send({
			type: DeviceEventType.START_PROACTIVE_QUESTION_SESSION
		});
	}

	const { websocketService } = useWebSocket();

	// --- Effect for Loading New Audio Source ---
	useEffect(() => {
		const audioEl = audioElementRef.current;
		if (!currentStory?.audioUrl || !audioEl) return;

		// Only change source if the URL is different
		if (audioEl.src !== currentStory.audioUrl) {
			console.log(`[TrackAudio] Loading new source: ${currentStory.audioUrl}`);
			setIsAudioLoading(true);
			audioEl.src = currentStory.audioUrl;
			audioEl.load(); // Tell the browser to load the new source
			setInternalDuration(0); // Reset duration until metadata loads
		}

	}, [currentStory?.audioUrl]); // Dependency: Only the URL

	// --- Effect for Play/Pause Control ---
	useEffect(() => {
		const audioEl = audioElementRef.current;
		if (!audioEl || isAudioLoading) return; // Don't try to play/pause if loading

		if (isStoryPlaying) {
			// The play() method returns a promise which might be rejected
			// if the user hasn't interacted with the page yet.
			audioEl.play().catch(error => {
				console.warn("[TrackAudio] Audio play failed (likely needs user interaction first):", error);
				// If play fails, we should probably reflect that in the state machine
				sendStopPlaybackEvent();
			});
		} else {
			audioEl.pause();
		}
		// Run when isStoryPlaying changes, or when loading finishes
	}, [isStoryPlaying, isAudioLoading, sendStopPlaybackEvent]);

	// --- Effect for Seeking ---
	useEffect(() => {
		const audioEl = audioElementRef.current;
		// Ensure element exists, isn't loading, metadata is ready, and story context is available
		if (!audioEl || !currentStory || isAudioLoading || audioEl.readyState < 1 /* HAVE_METADATA */) return;

		const targetTime = currentStory.currentTime;
		const currentTime = audioEl.currentTime;
		const difference = Math.abs(targetTime - currentTime);

		// Only seek if the difference is significant (e.g., > 1 second) to avoid fighting onTimeUpdate
		// Also check if targetTime is a valid number
		if (difference > 1 && !isNaN(targetTime) && isFinite(targetTime)) {
			console.log(`[TrackAudio] Seeking from ${currentTime.toFixed(2)} to ${targetTime.toFixed(2)}`);
			audioEl.currentTime = targetTime;
		}
		// Run when the target time from context changes, or loading finishes
	}, [currentStory?.currentTime, isAudioLoading]);

	// --- <audio> Element Event Handlers ---

	// Called when metadata (including duration) is loaded
	const handleLoadedMetadata = useCallback(() => {
		const audioEl = audioElementRef.current;
		if (!audioEl || !currentStory) return;

		const duration = audioEl.duration;
		if (!isNaN(duration) && isFinite(duration)) {
			console.log(`[TrackAudio] Metadata loaded. Duration: ${duration.toFixed(2)}`);
			setInternalDuration(duration);
			// Update the state machine context with the correct duration and reset time
			// Resetting time ensures consistency when a new track loads
			sendSetCurrentStoryEvent({
				...currentStory,
				currentTime: 0, // Start at the beginning of the new track
				duration: duration
			});
		} else {
			console.warn("[TrackAudio] Loaded metadata but duration is invalid:", duration);
		}
		setIsAudioLoading(false); // Loading is complete
	}, [currentStory, sendSetCurrentStoryEvent]); // Dependency: currentStory to update context

	// Called frequently during playback
	const handleTimeUpdate = useCallback(() => {
		const audioEl = audioElementRef.current;
		// Ensure element exists, isn't loading, data is available, and we have context/duration
		if (!audioEl || !currentStory || isAudioLoading || audioEl.readyState < 2 /* HAVE_CURRENT_DATA */ || internalDuration <= 0) return;

		const currentTime = audioEl.currentTime;
		const now = Date.now();

		// --- Throttling Logic (Update every 2 seconds) ---
		if (now - lastUpdateTime.current >= SET_PROGRESS_INTERVAL_IN_MS) {
			lastUpdateTime.current = now; // Update the last update time

			// --- Update State Machine Context (Throttled) ---
			sendSetCurrentStoryEvent({
				...currentStory,
				currentTime: currentTime,
				duration: internalDuration // Use state variable for duration
			});

			// --- Send WebSocket Progress (Throttled) ---
			websocketService.storyProtocol.setStoryProgress({
				type: MessageType.SET_STORY_PROGRESS,
				payload: {
					...currentStory, // Send necessary story info
					currentTime: currentTime,
				},
			});
		}

		// --- LiveKit Connection Trigger Logic (remains unchanged, checked frequently) ---
		const isAtProactiveQuestionPoint = proactiveQuestionPoint && currentTime >= proactiveQuestionPoint.connectAt && currentTime - proactiveQuestionPoint.connectAt <= 1;

		const canConnectToLiveKit = !isConnectingToLivekit && !livekitConnectionDetails;
		if (isAtProactiveQuestionPoint && isStoryPlaying && canConnectToLiveKit && !isUserQuestionActive) {
			sendStartProactiveQuestionSessionEvent();
			sendSetAgentModelEvent(VoiceAgentModel.PROACTIVE_QUESTION);
		}

	}, [ // Extensive dependencies due to needing lots of context for updates/checks
		currentStory,
		isAudioLoading,
		internalDuration,
		websocketService,
		proactiveQuestionPoint,
		livekitConnectionDetails,
		isStoryPlaying,
		isUserQuestionActive,
		userId,
		sendSetCurrentStoryEvent,
	]);

	// Called when the audio track naturally finishes playing
	const handleAudioEnded = useCallback(() => {
		console.log("[TrackAudio] Audio ended.");
		// Logic to advance to the next story
		const currentIndex = stories.findIndex((song) => song.id === currentStory?.id);
		// Ensure we have a valid index and stories array
		if (currentIndex === -1 || stories.length === 0) {
			console.warn("[TrackAudio] Could not find current story index or stories list is empty.");
			sendStopPlaybackEvent(); // Stop if something went wrong
			return;
		}
		const nextSong = stories[(currentIndex + 1) % stories.length];
		// Set the next story in the state machine, resetting time/duration for the loading effect
		sendSetCurrentStoryEvent({ ...nextSong, currentTime: 0, duration: 0 });
		// Note: We don't explicitly call play here. The state machine logic +
		// the `isStoryPlaying` effect should handle starting the new track
		// if the player is intended to auto-advance.
	}, [stories, currentStory?.id, sendSetCurrentStoryEvent, sendStopPlaybackEvent]); // Dependencies for finding next story

	// Called when there's an error loading or playing the audio
	const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
		const audioEl = audioElementRef.current;
		console.error("[TrackAudio] Audio Element Error:", audioEl?.error, e);
		setIsAudioLoading(false); // Stop loading state on error
		// Signal error state / stop playback in the state machine
		sendStopPlaybackEvent();
		// Consider adding a specific error event to the state machine
	}, [sendStopPlaybackEvent]);

	// --- Get LiveKit Connection Details ---
	const getLiveKitRoomConnectionDetails = async (metadata: ProactiveQuestionConnectionMetadata): Promise<LiveKitConnectionDetails> => {
		const liveKitApi = new LiveKitApi();
		return await liveKitApi.getConnectionDetails(metadata) as LiveKitConnectionDetails;
	};

	// --- Render the hidden <audio> element ---
	return (
		<>
			<audio
				ref={audioElementRef}
				onLoadedMetadata={handleLoadedMetadata}
				onTimeUpdate={handleTimeUpdate}
				onEnded={handleAudioEnded}
				onError={handleError}
				onLoadStart={() => setIsAudioLoading(true)} // Explicitly set loading on load start
				// `preload="metadata"` helps get duration faster
				preload="metadata"
			/>
		</>
	);
};

export default TrackAudio;
