"use client";

import React, { useState } from "react";
import useGlobalState, { ChatCharacter } from "../GlobalState";
import AIVoiceModal from "../components/AIVoiceModal";
import { LiveKitApi, LiveKitConnectionDetails, ChatCharacterConnectionMetadata } from "../api/livekit";

const ChatCharacterPage: React.FC = () => {
    const { characters, setIsConnectingToLivekit, setLivekitConnectionDetails, userId } = useGlobalState();
    const [show, setShow] = useState(false);

    // --- Get LiveKit Connection Details ---
    const getLiveKitRoomConnectionDetails = async (metadata: ChatCharacterConnectionMetadata): Promise<LiveKitConnectionDetails> => {
        const liveKitApi = new LiveKitApi();
        return await liveKitApi.getConnectionDetails(metadata) as LiveKitConnectionDetails;
    };

    const handleClick = async (character: ChatCharacter) => {
        setIsConnectingToLivekit(true);
        try {
            const connectionDetails = await getLiveKitRoomConnectionDetails({
                userId: userId,
                metadata: character,
                agentType: "chat_character"
            });
            setLivekitConnectionDetails(connectionDetails);
            setShow(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConnectingToLivekit(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex space-x-8">
                {characters.map((character) => (
                    <div onClick={() => handleClick(character)} key={character.id}>
                        <div className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-semibold text-gray-700 cursor-pointer hover:shadow-xl transition-shadow duration-300">
                            {character.name}
                        </div>
                    </div>
                ))}
            </div>
            <AIVoiceModal show={show} onDisconnect={() => {
                setShow(false);
            }} onConnect={() => { }} />
        </div>
    );
};


export default ChatCharacterPage;
