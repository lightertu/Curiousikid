import { Room } from "livekit-client";
import useGlobalState from "../GlobalState";
import { useWebSocket } from "../contexts/WebSocketContext";
import { MessageType } from "../lib/websocket/MessageTypes";

export const useConversationalStory = () => {
    const { proactiveQuestionPoint, setProactiveQuestionPoint } = useGlobalState();
    const { websocketService } = useWebSocket();

    const clearProactiveQuestionPoint = () => {
        setProactiveQuestionPoint(null);
        websocketService.storyProtocol.clearProactiveQuestionPoint({
            type: MessageType.CLEAR_QUESTION_POINT,
            payload: proactiveQuestionPoint,
        });
    };

    return {
        clearProactiveQuestionPoint,
    };
};