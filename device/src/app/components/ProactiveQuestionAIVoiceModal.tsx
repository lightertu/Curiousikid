import useGlobalState from "../GlobalState";
import { useConversationalStory } from "../hooks/useConversationalStory";
import AIVoiceModal from "./AIVoiceModal";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const { isLivekitRoomConnected, setIsPlaying, voiceAgentState } = useGlobalState();
    const isVoiceAgentActive = voiceAgentState === "listening" || voiceAgentState === "thinking" || voiceAgentState === "speaking";
    const { clearProactiveQuestionPoint } = useConversationalStory();

    return (
        <AIVoiceModal
            show={isLivekitRoomConnected && isVoiceAgentActive}
            onDisconnect={() => {
                clearProactiveQuestionPoint();
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

