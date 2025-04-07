import useGlobalState from "../GlobalState";
import { useConversationalStory } from "../hooks/useConversationalStory";
import AIVoiceModal from "./AIVoiceModal";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const { isLivekitRoomConnected, setIsPlaying, voiceAgentState } = useGlobalState();
    const isVoiceAgentActive = voiceAgentState === "listening" || voiceAgentState === "thinking" || voiceAgentState === "speaking";
    const { clearQuestionPoint } = useConversationalStory();

    return (
        <AIVoiceModal
            show={isLivekitRoomConnected && isVoiceAgentActive}
            onDisconnect={() => {
                clearQuestionPoint();
                setIsPlaying(true);
            }}
            onConnect={() => {
                clearQuestionPoint();
                setIsPlaying(false);
            }}
        />
    );
};

export default ProactiveQuestionAIVoiceModal;

