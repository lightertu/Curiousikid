"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import useGlobalState from "../GlobalState";


const ChatCharacterPage: React.FC = () => {
    const { characters } = useGlobalState();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex space-x-8">
                {characters.map((character) => (
                    <Link href={`/chat-characters/${character.id}`} key={character.id}>
                        <div className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl font-semibold text-gray-700 cursor-pointer hover:shadow-xl transition-shadow duration-300">
                            {character.name}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};


export default ChatCharacterPage;
