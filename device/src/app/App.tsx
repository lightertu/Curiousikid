"use client";

import React, { useEffect } from "react";

// Import components
import { useWebSocket } from "./contexts/WebSocketContext";
import { MessageType } from "./lib/websocket/MessageTypes";
import useDeviceState, { DeviceState } from "./DeviceState";
import PixelGrid from "./components/PixelGrid";
import DeviceIndicator from "./components/DeviceIndicator";
import { deviceMachine, DeviceEventType, DeviceContext } from "./DeviceStateMachine";
import { useMachine } from '@xstate/react';
import { AnyEventObject, MachineSnapshot, MetaObject, NonReducibleUnknown, StateValue } from "xstate";
import { AnyActorRef } from "xstate";
// Moved KeyCap to its own component file
// import { KeyCap } from "./components/KeyCap"; // Assuming you create this

// Simple component to render text like a keyboard key

const App: React.FC = () => {
	const { websocketService } = useWebSocket();
	const initialState: DeviceState = useDeviceState();
	const { isWebSocketConnected, userId } = useDeviceState();
	const [deviceState, send] = useMachine(deviceMachine);

	const yo: MachineSnapshot<DeviceContext, AnyEventObject, Record<string, AnyActorRef>, StateValue, string, NonReducibleUnknown, MetaObject, any> = deviceState

	// Log that the app has loaded
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
					send({ type: DeviceEventType.ESC_PRESSED });
					console.log('Escape key pressed, state:', deviceState.value);
					break;
				case 'Enter':
					send({ type: DeviceEventType.ENTER_PRESSED });
					console.log('Enter key pressed, state:', deviceState.value);
					break;
				case 'ArrowLeft':
					send({ type: DeviceEventType.LEFT_PRESSED });
					console.log('ArrowLeft key pressed, state:', deviceState.value);
					break;
				case 'ArrowRight':
					send({ type: DeviceEventType.RIGHT_PRESSED });
					console.log('ArrowRight key pressed, state:', deviceState.value);
					break;
				case ' ':
					send({ type: DeviceEventType.SPACE_PRESSED });
					console.log('Space key pressed - Toggling play/pause, state:', deviceState.value);
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
	}, []); // Dependency array

	return (
		// Adjust layout to include indicators
		<div className="flex min-h-screen items-center justify-center bg-gray-900 space-x-16">
			{/* Main content area with instructions and PixelGrid */}
			<div className="flex flex-col items-center">
				{/* Render the PixelGrid */}
				<PixelGrid rows={22} cols={22} pixelData={deviceState.context.screen} />
			</div>
			<DeviceIndicator />
		</div>
	);
};

export default App;
