import React from 'react';
import AIVoiceConsole from './livekit/AIVoiceConsole';
import { useSelector } from '@xstate/react';
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType, VoiceAgentModel } from '../DeviceStateMachine';

interface PixelScreenProps {
    pixelData: string[][] | null | undefined; // Allow null/undefined
    rows?: number;
    cols?: number;
}


const PixelScreen: React.FC<PixelScreenProps> = ({ pixelData, rows = 32, cols = 32 }) => {
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

    const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
        return {
            value: state.value,
            context: state.context
        }
    });

    const { isShowAIVoiceConsole } = deviceContext.context;

    const renderAiVoiceConsole = () => {
        const handleDisconnect = () => {
            DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SET_AGENT_MODEL, payload: { agentModel: VoiceAgentModel.INACTIVE } });
            DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.STORY_QUESTION_SESSION_ENDED });
        }
        return (
            <div
                className="block border my-8 rounded-lg overflow-hidden" // Removed p-1, removed grid props, display: block
                style={{
                    borderColor: '#979490',
                    borderWidth: `${borderWidthPx}px`,
                    width: `${totalWidth}px`,
                    height: `${totalHeight}px`,
                }}
            >
                <AIVoiceConsole show={true} onDisconnect={handleDisconnect} onConnect={() => { }} />
            </div>
        );
    }

    const renderPixelScreen = () => {
        return (
            <div
                className="inline-grid border p-1 my-8 rounded-lg overflow-hidden"
                style={{
                    borderColor: '#979490',
                    borderWidth: `${borderWidthPx}px`,
                    width: `${totalWidth}px`,
                    height: `${totalHeight}px`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    gap: `${gapPx}px`,
                }}
            >
                {displayPixels.map((color, index) => (
                    <div
                        key={index}
                        className="w-7 h-7 rounded-sm"
                        style={{ backgroundColor: color || 'transparent' }}
                    ></div>
                ))}
            </div>
        );
    }

    return isShowAIVoiceConsole ? renderAiVoiceConsole() : renderPixelScreen();
};

export default PixelScreen;