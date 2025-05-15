"use client";

import React, { useEffect, useRef } from 'react';
import ChatBubble from './chat-bubble';

interface Message {
    role: string;
    text: string;
    timestamp: string; // Assuming timestamp is unique enough for a key if no other ID exists
    isFinal: boolean;
}

interface GroupedMessage {
    role: 'user' | 'assistant';
    texts: string[]; // Store individual text pieces for potential future styling
    fullText: string; // Concatenated text for display
    isFinal: boolean;
    // Use the timestamp of the first message in the group as a key part
    // Or generate a unique ID for each group if timestamps aren't reliable enough
    key: string;
}

interface TranscriptionDisplayProps {
    conversation: Message[];
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ conversation }) => {
    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null); // Ref to help scroll to the actual bottom

    const groupedConversation = conversation.reduce<GroupedMessage[]>((acc, currentMsg) => {
        const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;

        if (lastGroup && lastGroup.role === currentMsg.role && !lastGroup.isFinal) {
            // If the last group is from the same role and NOT YET FINAL,
            // we assume this new message (partial or final) is an update to THAT utterance.
            lastGroup.fullText = currentMsg.text; // Update with the latest text
            lastGroup.isFinal = currentMsg.isFinal; // Update its final status
            lastGroup.texts.push(currentMsg.text); // Store all raw texts for potential future reference
        } else {
            // Start a new group if:
            // 1. It's the first message.
            // 2. Role changes.
            // 3. The PREVIOUS group from the same role was already marked as final.
            acc.push({
                role: currentMsg.role as 'user' | 'assistant',
                texts: [currentMsg.text],
                fullText: currentMsg.text,
                isFinal: currentMsg.isFinal,
                key: `${currentMsg.role}-${currentMsg.timestamp}-${acc.length}`
            });
        }
        return acc;
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when new messages are added
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);

    return (
        // Outer container to hide the scrollbar space
        <div className="h-full w-full overflow-hidden">
            {/* Inner container that actually scrolls. Made slightly wider to push scrollbar out of view if CSS hiding fails for blinking. */}
            {/* The pr-[17px] (approx scrollbar width) and box-content are key here. */}
            {/* The custom-scrollbar class with display:none for ::-webkit-scrollbar should still be active in globals.css */}
            <div
                ref={scrollableContainerRef}
                className="h-full w-full overflow-y-scroll flex flex-col justify-end space-y-1 custom-scrollbar pr-[17px] box-content"
            >
                {/* Content wrapper to counteract the padding-right on the scrollable div */}
                <div className="mr-[-17px]">
                    {groupedConversation.map((group) => (
                        <ChatBubble
                            key={group.key}
                            role={group.role}
                            text={group.fullText}
                            isFinal={group.isFinal}
                        />
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};

export default TranscriptionDisplay; 