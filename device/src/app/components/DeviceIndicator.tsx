import useDeviceState from "../DeviceState";
import { StatusIndicator } from "./StatusIndicator";

// Simple component to render text like a keyboard key
const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 mx-1 text-gray-200 font-mono text-sm">
        {children}
    </span>
);

const DeviceIndicator: React.FC = () => {
    const { isLivekitRoomConnected, isWebSocketConnected } = useDeviceState();
    const { userId } = useDeviceState();

    return (
        <div className="flex flex-col">
            <StatusIndicator
                labelOn="Microphone On"
                labelOff="Microphone Off"
                colorOn="bg-blue-400" // Light Blue for On
                colorOff="bg-gray-600" // Grey for Off
                isOn={isLivekitRoomConnected}
            />
            <StatusIndicator
                labelOn="Online"
                labelOff="Offline"
                colorOn="bg-green-400" // Light Green for On
                colorOff="bg-red-500" // Red for Off
                isOn={isWebSocketConnected}
            />

            {/* Keyboard Instructions - ADDED HERE */}
            <div className="text-gray-400 mt-8 text-lg space-y-4"> {/* Changed text-sm to text-base */}
                <div className="flex items-center">
                    <KeyCap>Esc</KeyCap>
                    <span className="ml-2">Back</span>
                </div>
                <div className="flex items-center">
                    <KeyCap>Enter</KeyCap>
                    <span className="ml-2">Select / Interrupt Story</span>
                </div>
                <div className="flex items-center">
                    <KeyCap>←</KeyCap>
                    <KeyCap>→</KeyCap>
                    <span className="ml-2">Navigate</span>
                </div>
                <div className="flex items-center">
                    <KeyCap>Space</KeyCap>
                    <span className="ml-2">Play / Pause</span>
                </div>
            </div>
        </div>
    );
};

export default DeviceIndicator;
