import { useEffect } from "react";
import AIVoiceModal from "./AIVoiceModal";
import { DEVICE_STATE_MACHINE_ACTOR, DeviceEventType } from "../DeviceStateMachine";
import { useSelector } from "@xstate/react";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const deviceContext = useSelector(DEVICE_STATE_MACHINE_ACTOR, (state) => {
        return {
            value: state.value,
            context: state.context
        }
    });
    const { isLivekitRoomConnected, isProactiveQuestionActive, setIsProactiveQuestionActive } = deviceContext.context;
    const isVoiceAgentActive =
        deviceContext.context.voiceAgentState === "listening" ||
        deviceContext.context.voiceAgentState === "thinking" ||
        deviceContext.context.voiceAgentState === "speaking";

    useEffect(() => {
        console.log("isLivekitRoomConnected", isLivekitRoomConnected);
        console.log("isVoiceAgentActive", isVoiceAgentActive);
        console.log("isProactiveQuestionActive", isProactiveQuestionActive);
    }, [isLivekitRoomConnected, isVoiceAgentActive, isProactiveQuestionActive]);

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
            onDisconnect={handleDisconnect}
            onConnect={handleConnect}
        />
    );
};

export default ProactiveQuestionAIVoiceModal;

