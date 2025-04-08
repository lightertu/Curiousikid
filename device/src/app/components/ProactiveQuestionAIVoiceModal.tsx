import { useEffect } from "react";
import useGlobalState from "../GlobalState";
import { useConversationalStory } from "../hooks/useConversationalStory";
import AIVoiceModal from "./AIVoiceModal";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const { isLivekitRoomConnected, setIsPlaying, voiceAgentState, isProactiveQuestionActive, setIsProactiveQuestionActive } = useGlobalState();
    const isVoiceAgentActive = voiceAgentState === "listening" || voiceAgentState === "thinking" || voiceAgentState === "speaking";
    const { clearProactiveQuestionPoint } = useConversationalStory();

    useEffect(() => {
        console.log("isLivekitRoomConnected", isLivekitRoomConnected);
        console.log("isVoiceAgentActive", isVoiceAgentActive);
        console.log("isProactiveQuestionActive", isProactiveQuestionActive);
    }, [isLivekitRoomConnected, isVoiceAgentActive, isProactiveQuestionActive]);

    return (
        <AIVoiceModal
            headline="Proactive Question"
            show={isLivekitRoomConnected && isVoiceAgentActive && isProactiveQuestionActive}
            onDisconnect={() => {
                clearProactiveQuestionPoint();
                setIsProactiveQuestionActive(false);
                setIsPlaying(true);
            }}
            onConnect={() => {
                clearProactiveQuestionPoint();
                setIsPlaying(false);
            }}
        />
    );
};

export default ProactiveQuestionAIVoiceModal;

