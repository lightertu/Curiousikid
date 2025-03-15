"use client";

import React, { useEffect } from "react";
import clsx from "clsx";

// Import components
import Player from "./components/Player";
import Library from "./components/Library";
import Nav from "./components/Nav";
import useGlobalState from "./GlobalState";
import AIVoiceModal from "./components/AudioStreamModal";
import WebSocketHandler from "./components/WebSocketHandler";
import WebSocketStatus from "./components/WebSocketStatus";

// Define interfaces
//
const App: React.FC = () => {
	const { libraryStatus } = useGlobalState();

	// Log that the app has loaded
	useEffect(() => {
		console.log("App loaded - WebSocket connection should be established");
	}, []);

	return (
		<div className={clsx(
			"flex flex-col justify-center transition-all duration-500 ease-in-out",
			libraryStatus ? "md:ml-80" : "ml-0",
			"max-md:ml-0"
		)}>
			{/* WebSocketHandler manages connection - no UI */}
			<WebSocketHandler />
			<Nav />
			<Player />
			<Library />
			<AIVoiceModal />
			{/* Status indicator for WebSocket connection */}
			<WebSocketStatus />
		</div>
	);
};

export default App;
