import { useSelector } from "@xstate/react";
import useDeviceState from "../DeviceState";
import { StatusIndicator } from "./StatusIndicator";
import { DEVICE_STATE_MACHINE_ACTOR } from "../DeviceStateMachine";

// Simple component to render text like a keyboard key
const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block border border-gray-600 rounded px-1.5 py-0.5 mx-1 text-black font-mono text-3xl" style={{ backgroundColor: '#ded8cf' }}>
        {children}
    </span>
);

const DeviceIndicator: React.FC = () => {
    const { isWebSocketConnected } = useDeviceState();
    const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
        return {
            value: state.value,
            context: state.context
        }
    });

    const isMicrophoneOn = deviceContext.context.agentState === 'speaking' || deviceContext.context.agentState === 'listening' || deviceContext.context.agentState === 'thinking';

    return (
        <div className="flex flex-col">
            <StatusIndicator
                labelOn={`AI is ${deviceContext.context.agentState}...`}
                labelOff={`AI is ${deviceContext.context.agentState}`}
                colorOn="#4ade80" // Light Green for On
                colorOff="#ada9a5" // Grey for Off
                isOn={isMicrophoneOn}
            />
            <StatusIndicator
                labelOn="Online"
                labelOff="Offline"
                colorOn="#4ade80" // Light Green for On
                colorOff="#ada9a5" // Red for Off
                isOn={isWebSocketConnected}
            />

            {/* Keyboard Instructions - ADDED HERE */}
            <div className="text-black mt-8 text-3xl space-y-4"> {/* Changed text-sm to text-base */}
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
                    <span className="ml-2">Pause / Resume</span>
                </div>
            </div>
        </div>
    );
};

export default DeviceIndicator;
