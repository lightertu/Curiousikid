import { useEffect } from 'react';
import { useVoiceAssistant, useMaybeRoomContext, RoomAudioRenderer, BarVisualizer, VoiceAssistantControlBar } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface AIVoiceConsoleProps {
    show: boolean;
    onDisconnect: () => void;
    onConnect: () => void;
}

const AIVoiceConsole: React.FC<AIVoiceConsoleProps> = ({ show = true, onDisconnect = () => { }, onConnect: onConnected = () => { } }) => {
    const { state: agentState, audioTrack } = useVoiceAssistant();
    const room = useMaybeRoomContext();

    useEffect(() => {
        const handleDisconnect = () => {
            if (room) {
                room.disconnect();
                onDisconnect();
                room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
            }
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
        <div className="w-full h-full flex flex-col dark:bg-gray-800 text-black dark:text-white overflow-hidden" style={{ backgroundColor: '#f9f6f0' }} >
            <main data-lk-theme="custom-theme" className="flex-grow flex flex-col p-2 overflow-hidden">
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
                    <div
                        className="flex-shrink-0 flex h-10 justify-center items-center space-x-10 p-1 dark:border-gray-700"
                        style={{ transform: 'scale(2.0)', marginBottom: '7em' }}
                    >
                        <VoiceAssistantControlBar controls={{ leave: false }} />
                    </div>
                )}
                <RoomAudioRenderer />
            </main>
        </div>
    );
};

export default AIVoiceConsole;