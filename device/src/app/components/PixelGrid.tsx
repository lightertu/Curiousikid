import React, { useEffect } from 'react';
import { AgentState, RoomAudioRenderer, useMaybeRoomContext, useVoiceAssistant, BarVisualizer, VoiceAssistantControlBar, DisconnectButton } from '@livekit/components-react';
import { AudioTrack, RoomEvent } from 'livekit-client';
import { NoAgentNotification } from './livekit/NoAgentNotification';
import { CloseIcon } from './livekit/CloseIcon';

interface PixelGridProps {
    pixelData: string[][] | null | undefined; // Allow null/undefined
    rows?: number;
    cols?: number;
}

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
        };
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
            {/* Modal content */}
            <div className="relative w-[80%] max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <h1 className="text-2xl font-bold p-4 border-b dark:border-gray-700">{headline}</h1>
                <main data-lk-theme="default" className="p-8">
                    <div className="h-[300px] mx-auto mb-6">
                        <BarVisualizer
                            state={agentState}
                            barCount={5}
                            trackRef={audioTrack}
                            className="agent-visualizer"
                            options={{ minHeight: 24 }}
                        />
                    </div>
                    {agentState !== "disconnected" && (
                        <div className="flex h-8 justify-center items-center space-x-4">
                            <VoiceAssistantControlBar controls={{ leave: false }} />
                            <DisconnectButton onClick={onDisconnect}>
                                <CloseIcon />
                            </DisconnectButton>
                        </div>
                    )}
                    <RoomAudioRenderer />
                    <NoAgentNotification state={agentState} />
                </main>
            </div>
        </div>
    );
};

const PixelGrid: React.FC<PixelGridProps> = ({ pixelData, rows = 32, cols = 32 }) => {

    // --- Calculate fixed dimensions ---
    const pixelSizePx = 28; // Based on w-7/h-7 (1.75rem at 16px base)
    const gapPx = 2;
    const paddingPx = 4; // Based on p-1 (0.25rem at 16px base)
    const borderWidthPx = 1;

    const totalWidth = (cols * pixelSizePx) + (Math.max(0, cols - 1) * gapPx) + (2 * paddingPx) + (2 * borderWidthPx);
    const totalHeight = (rows * pixelSizePx) + (Math.max(0, rows - 1) * gapPx) + (2 * paddingPx) + (2 * borderWidthPx);

    // --- Prepare pixel data for rendering ---
    // Ensure pixelData is a valid 2D array, even if null/undefined/malformed
    const safePixelData = Array.isArray(pixelData) ? pixelData : [];
    // Flatten, ensuring inner elements are arrays before flattening
    const flatPixelData = safePixelData.every(Array.isArray) ? safePixelData.flat() : [];
    // Create a placeholder array if needed (e.g., for empty grid layout)
    const displayPixels = flatPixelData.length > 0 ? flatPixelData : Array(rows * cols).fill(null);

    return (
        <div
            className="inline-grid border p-1 my-8 rounded-lg overflow-hidden" // Added overflow-hidden
            style={{
                borderColor: '#979490',
                borderWidth: `${borderWidthPx}px`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, // Define rows explicitly
                gap: `${gapPx}px`,
                width: `${totalWidth}px`,  // Apply fixed width
                height: `${totalHeight}px`, // Apply fixed height
                // backgroundColor: '#374151' // Set a background for empty state visibility
            }}
        >
            {/* Render grid cells. Use placeholder array if data is empty */}
            {displayPixels.map((color, index) => (
                <div
                    key={index}
                    className="w-7 h-7 rounded-sm" // Fixed size for cells
                    style={{ backgroundColor: color || 'transparent' }} // Use data color or transparent if placeholder
                ></div>
            ))}
            {/* <AIVoiceConsole show={true} headline="Proactive Question" onDisconnect={() => { }} onConnect={() => { }} /> */}
        </div>
    );
};

export default PixelGrid;