import { Room } from "livekit-client";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";

export const useConversationalStory = () => {
    const { questionPoint, setQuestionPoint } = useGlobalState();
    const { websocketService } = useWebSocket();

    const clearQuestionPoint = () => {
        setQuestionPoint(null);
        websocketService.storyProtocol.clearQuestionPoint({
            type: MessageType.CLEAR_QUESTION_POINT,
            payload: questionPoint,
        });
    };

    return {
        clearQuestionPoint,
    };
};