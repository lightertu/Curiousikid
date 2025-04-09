import { useEffect } from "react";
import AIVoiceModal from "./AIVoiceModal";
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType } from "../DeviceStateMachine";
import { useSelector } from "@xstate/react";
import { useVoiceAssistant } from "@livekit/components-react";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
        return {
            value: state.value,
            context: state.context
        }
    });
    const { state: agentState, audioTrack } = useVoiceAssistant();
    const { isLivekitRoomConnected, isProactiveQuestionActive, setIsProactiveQuestionActive } = deviceContext.context;
    const isVoiceAgentActive =
        agentState === "listening" ||
        agentState === "thinking" ||
        agentState === "speaking";

    const handleDisconnect = () => {
        DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.PROACTIVE_QUESTION_SESSION_ENDED });
    }

    const handleConnect = () => {
        DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.PROACTIVE_QUESTION_SESSION_STARTED });
    }

    return (
        <AIVoiceModal
            headline="Proactive Question"
            show={isLivekitRoomConnected && isVoiceAgentActive && isProactiveQuestionActive}
            agentState={agentState}
            audioTrack={audioTrack}
            onDisconnect={handleDisconnect}
            onConnect={handleConnect}
        />
    );
};

export default ProactiveQuestionAIVoiceModal;

