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
// Moved KeyCap to its own component file
// import { KeyCap } from "./components/KeyCap"; // Assuming you create this

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
					console.log('Escape key pressed, state:', deviceContext.value);
					break;
				case 'Enter':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.ENTER_PRESSED });
					console.log('Enter key pressed, state:', deviceContext.value);
					break;
				case 'ArrowLeft':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.LEFT_PRESSED });
					console.log('ArrowLeft key pressed, state:', deviceContext.value);
					break;
				case 'ArrowRight':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.RIGHT_PRESSED });
					console.log('ArrowRight key pressed, state:', deviceContext.value);
					break;
				case ' ':
					DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SPACE_PRESSED });
					console.log('Space key pressed - Toggling play/pause, state:', deviceContext.value);
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

	// Effect to log state changes
	useEffect(() => {
		// This code runs after every state transition
		console.log("State Machine Changed:");
		console.log("  - State Value:", deviceContext.value);
		console.log("  - Context:", deviceContext.context);
		// Optionally log the event that caused the change
		// console.log("  - Event:", deviceState.event);
	}, [deviceContext]); // Re-run this effect whenever the deviceState object changes

	return (
		// Adjust layout to include indicators
		<div className="flex min-h-screen items-center justify-center bg-gray-900 space-x-16">
			{/* Main content area with instructions and PixelGrid */}
			<div className="flex flex-col items-center">
				{/* Render the Breadcrumb component */}
				<Breadcrumb stateValue={deviceContext.value} />
				{/* Render the PixelGrid */}
				<PixelGrid rows={22} cols={22} pixelData={deviceContext.context.screen} />
			</div>
			<DeviceIndicator />
			<TrackAudio />
		</div>
	);
};

export default App;
