"use client";

import React, { useEffect } from "react";
import Link from "next/link";

// Import components
import { useWebSocket } from "./contexts/WebSocketContext";
import { MessageType } from "./lib/websocket/MessageTypes";
import useGlobalState from "./GlobalState";
import WebSocketHandler from "./components/WebSocketHandler";
import WebSocketStatus from "./components/WebSocketStatus";

const App: React.FC = () => {
	const { websocketService } = useWebSocket();
	const { isWebSocketConnected } = useGlobalState();
	const { userId } = useGlobalState();

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

	}, [isWebSocketConnected]);

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100">
			<WebSocketHandler />
			<div className="flex space-x-8">
				{/* Card 1 */}
				<Link href="/player">
					<div className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-semibold text-gray-700 cursor-pointer hover:shadow-xl transition-shadow duration-300">
						Player
					</div>
				</Link>

				{/* Card 2 */}
				<Link href="/chat-characters">
					<div className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-semibold text-gray-700 cursor-pointer hover:shadow-xl transition-shadow duration-300">
						Chat Characters
					</div>
				</Link>
			</div>
			<WebSocketStatus />
		</div>
	);
};

export default App;
