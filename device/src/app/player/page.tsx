"use client";

import React, { useEffect } from "react";
import clsx from "clsx";

// Import components
import Player from "../components/Player";
import Library from "../components/Library";
import Nav from "../components/Nav";
import useDeviceState from "../DeviceState";
import WebSocketHandler from "../components/WebSocketHandler";
import WebSocketStatus from "../components/WebSocketStatus";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";
import { LiveKitRoom } from "@livekit/components-react";
import { MediaDeviceFailure } from "livekit-client";
import ProactiveQuestionAIVoiceModal from "../components/ProactiveQuestionAIVoiceModal";
// Define interfaces
//

const Page: React.FC = () => {
    const {
        libraryStatus,
        livekitConnectionDetails,
        isLivekitRoomConnected,
        setIsLivekitRoomConnected,
        isConnectingToLivekit,
        setIsConnectingToLivekit,
        setLivekitConnectionDetails
    } = useDeviceState();
    const { websocketService } = useWebSocket();

    // Log that the app has loaded
    useEffect(() => {
        if (websocketService?.storyProtocol) {
            websocketService.storyProtocol.getStoryList({
                type: MessageType.GET_STORY_LIST,
                payload: { userId: "1" }
            });
        }
    }, []);

    return (
        <div className={clsx(
            "flex flex-col justify-center transition-all duration-500 ease-in-out",
            libraryStatus ? "md:ml-80" : "ml-0",
            "max-md:ml-0"
        )}>
            <Nav />
            <Player />
            <Library />
            <ProactiveQuestionAIVoiceModal />
            {/* Status indicator for WebSocket connection */}
        </div>
    );
};


export default Page;
