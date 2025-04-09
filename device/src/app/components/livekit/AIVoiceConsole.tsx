import { useEffect } from 'react';
import { useVoiceAssistant, useMaybeRoomContext, RoomAudioRenderer, BarVisualizer, VoiceAssistantControlBar, DisconnectButton } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { CloseIcon } from './CloseIcon';

interface AIVoiceConsoleProps {
    show: boolean;
    headline: string;
    onDisconnect: () => void;
    onConnect: () => void;
}

const AIVoiceConsole: React.FC<AIVoiceConsoleProps> = ({ show = true, headline = "Proactive Question", onDisconnect = () => { }, onConnect: onConnected = () => { } }) => {
    const { state: agentState, audioTrack } = useVoiceAssistant();
    const room = useMaybeRoomContext();

    useEffect(() => {
        const handleDisconnect = () => {
            if (room) {
                room.disconnect();
                onDisconnect();
                room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
            }
            console.log("Disconnected from room");
        }

        if (room) {
            room.on(RoomEvent.ParticipantDisconnected, handleDisconnect);
        }

        return () => {
            if (room) {
                room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
            }
        }
    }, [room, onDisconnect]);

    useEffect(() => {
        const isAgentConnected = agentState === "speaking" || agentState === "listening" || agentState === "thinking";
        if (isAgentConnected) {
            onConnected();
        }
    }, [agentState, onConnected]);

    if (!show) {
        return null;
    }

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-black dark:text-white overflow-hidden">
            <main data-lk-theme="default" className="flex-grow flex flex-col p-2 overflow-hidden">
                <h1 className="text-2xl font-bold">{headline}</h1>
                <div className="flex-grow flex items-center justify-center mb-2">
                    <BarVisualizer
                        state={agentState}
                        barCount={5}
                        trackRef={audioTrack}
                        className="agent-visualizer w-full h-full"
                        options={{ minHeight: 16 }}
                    />
                </div>
                {agentState !== "disconnected" && (
                    <div className="flex-shrink-0 flex h-10 justify-center items-center space-x-2 p-1 border-t dark:border-gray-700">
                        <VoiceAssistantControlBar controls={{ leave: false }} />
                        <DisconnectButton onClick={onDisconnect}>
                            <CloseIcon />
                        </DisconnectButton>
                    </div>
                )}
                <RoomAudioRenderer />
            </main>
        </div>
    );
};

export default AIVoiceConsole;