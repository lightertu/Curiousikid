import useGlobalState from "../GlobalState";
import { useConversationalStory } from "../hooks/ConversationalStory";
import GeneralAIVoiceModal from "./GenericAIVoiceModal";

const ProactiveQuestionAIVoiceModal: React.FC = () => {
    const { isLivekitRoomConnected, setIsPlaying, voiceAgentState } = useGlobalState();
    const isVoiceAgentActive = voiceAgentState === "listening" || voiceAgentState === "thinking" || voiceAgentState === "speaking";
    const { clearQuestionPoint } = useConversationalStory();

    return (
        <GeneralAIVoiceModal
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

