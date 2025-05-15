"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
    role: 'user' | 'assistant';
    text: string;
    isFinal: boolean;
    // timestamp?: string; // Add if you want to display timestamps
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, isFinal }) => {
    const isUser = role === 'user';

    const bubbleVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <motion.div
            variants={bubbleVariants}
            initial="hidden"
            animate="visible"
            className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`
          max-w-[70%] p-3 rounded-2xl text-white text-sm leading-snug
          ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-neutral-700 rounded-bl-none'}
          ${!isFinal ? 'opacity-70' : 'opacity-100'}
        `}
                style={{ wordBreak: 'break-word' }}
            >
                {text || '...'}
            </div>
        </motion.div>
    );
};

export default ChatBubble; 