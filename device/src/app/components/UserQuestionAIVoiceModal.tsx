import useGlobalState from "../GlobalState";
import { useConversationalStory } from "../hooks/useConversationalStory";
import AIVoiceModal from "./AIVoiceModal";
import { useEffect } from "react";

const UserQuestionAIVoiceModal: React.FC = () => {
    const { isLivekitRoomConnected, setIsPlaying, voiceAgentState } = useGlobalState();
    const isVoiceAgentActive = voiceAgentState === "listening" || voiceAgentState === "thinking" || voiceAgentState === "speaking";
    
    useEffect(() => {
        if (isLivekitRoomConnected) {
            setIsPlaying(false);
        }
    }, [isLivekitRoomConnected]);

    return (
        <AIVoiceModal
            show={isLivekitRoomConnected && isVoiceAgentActive}
            onDisconnect={() => {
                setIsPlaying(true);
            }}
            onConnect={() => {
                setIsPlaying(false);
            }}
        />
    );
};

export default UserQuestionAIVoiceModal;

