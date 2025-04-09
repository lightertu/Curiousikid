"use client";

import React, { useEffect } from "react";

// Import components
import { useWebSocket } from "./contexts/WebSocketContext";
import { MessageType } from "./lib/websocket/MessageTypes";
import useDeviceState from "./DeviceState";
import PixelGrid from "./components/PixelGrid";
import DeviceIndicator from "./components/DeviceIndicator";
import { DeviceEventType, DEVICE_STATE_MACHINE_ACTOR } from "./DeviceStateMachine";
import Breadcrumb from "./components/Breadcrumb";
import { useSelector } from '@xstate/react';
import TrackAudio from "./components/TrackAudio";
import ProactiveQuestionAIVoiceModal from "./components/ProactiveQuestionAIVoiceModal";

// Simple component to render text like a keyboard key

const App: React.FC = () => {
	const { websocketService } = useWebSocket();
	const { isWebSocketConnected, userId } = useDeviceState();
	const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
		return {
			value: state.value,
			context: state.context
		}
	});

	useEffect(() => {
		if (isWebSocketConnected) {
			console.log("userId", userId);
			websocketService.storyProtocol.getStoryList({
				type: MessageType.GET_STORY_LIST,
				payload: { userId: userId }
			});

			websocketService.chatCharacterProtocol.getChatCharacterList({
				type: MessageType.GET_CHAT_CHARACTER_LIST,
				payload: { userId: userId }
			});

		}

	}, [isWebSocketConnected, userId, websocketService]);

	// Keyboard event handling
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat) return; // Ignore repeated keydown events

			switch (event.key) {
				case 'Escape':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.ESC_PRESSED });
					break;
				case 'Enter':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.ENTER_PRESSED });
					break;
				case 'ArrowLeft':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.LEFT_PRESSED });
					break;
				case 'ArrowRight':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.RIGHT_PRESSED });
					break;
				case ' ':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SPACE_PRESSED });
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		// Cleanup function
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [deviceContext]); // Dependency array

	// // Effect to log state changes
	// useEffect(() => {
	// 	// This code runs after every state transition
	// 	console.log("State Machine Changed:");
	// 	console.log("  - State Value:", deviceContext.value);
	// 	console.log("  - Context:", deviceContext.context);
	// }, [deviceContext]); // Re-run this effect whenever the deviceState object changes

	return (
		// Adjust layout to include indicators
		<div className="flex min-h-screen items-center justify-center space-x-16" style={{ backgroundColor: '#f0ece2' }}>
			{/* Main content area with instructions and PixelGrid */}
			<div className="flex flex-col items-center">
				{/* Render the Breadcrumb component */}
				<Breadcrumb context={deviceContext.context} stateValue={deviceContext.value} />
				{/* Render the PixelGrid */}
				<PixelGrid rows={32} cols={32} pixelData={deviceContext.context.screen} validatePixelData={false} />
			</div>
			<DeviceIndicator />
			<TrackAudio />
			{/* <ProactiveQuestionAIVoiceModal /> */}
		</div>
	);
};

export default App;
