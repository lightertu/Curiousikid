import { useEffect } from "react";
import AIVoiceModal from "./AIVoiceModal";
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType, VoiceAgentModel } from "../DeviceStateMachine";
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
        DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SET_AGENT_MODEL, payload: { agentModel: VoiceAgentModel.INACTIVE } });
    }

    const handleConnect = () => {
        DEVICE_STATE_MACHINE_ACTOR.send({ type: DeviceEventType.SET_AGENT_MODEL, payload: { agentModel: VoiceAgentModel.PROACTIVE_QUESTION } });
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

