"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, PhoneCall, MicVocal } from 'lucide-react';
import ReactSiriwave, { IReactSiriwaveProps } from 'react-siriwave';
import { motion, AnimatePresence } from 'framer-motion';
import useVapi from '@/components/hooks/use-vapi'; // Adjust the import path as needed

// Define CurveStyle type
type CurveStyle = "ios" | "ios9";

interface SiriProps {
    theme: CurveStyle;
}

const VoiceConsole: React.FC<SiriProps> = ({ theme }) => {
    const { volumeLevel, isSessionActive, toggleCall } = useVapi();
    const siriWaveContainerRef = useRef<HTMLDivElement>(null);

    const [siriWaveConfig, setSiriWaveConfig] = useState<IReactSiriwaveProps>({
        theme: theme || "ios9",
        ratio: 1,
        speed: 0.2,
        amplitude: 1,
        frequency: 6,
        color: '#9E9E9E',
        cover: true,
        width: 300,
        height: 100,
        autostart: true,
        pixelDepth: 1,
        lerpSpeed: 0.1,
    });

    useEffect(() => {
        const updateWidth = () => {
            if (siriWaveContainerRef.current) {
                const containerWidth = siriWaveContainerRef.current.offsetWidth;
                const padding = 32;
                const newWidth = Math.max(0, containerWidth - padding);
                setSiriWaveConfig(prevConfig => ({
                    ...prevConfig,
                    width: newWidth,
                }));
            }
        };

        updateWidth();

        window.addEventListener('resize', updateWidth);

        return () => {
            window.removeEventListener('resize', updateWidth);
        };
    }, []);

    useEffect(() => {
        setSiriWaveConfig(prevConfig => ({
            ...prevConfig,
            amplitude: isSessionActive ? (volumeLevel > 0.01 ? volumeLevel * 7.5 : 0) : 0,
            speed: isSessionActive ? (volumeLevel > 0.5 ? volumeLevel * 10 : 0) : 0,
            frequency: isSessionActive ? (volumeLevel > 0.01 ? volumeLevel * 5 : 0) : (volumeLevel > 0.5 ? volumeLevel * 10 : 0),
        }));
    }, [volumeLevel, isSessionActive]);

    const handleToggleCall = () => {
        toggleCall();
    };

    const handleConfigChange = (key: keyof IReactSiriwaveProps, value: any) => {
        setSiriWaveConfig(prevConfig => ({
            ...prevConfig,
            [key]: value,
        }));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full">
            <motion.div
                ref={siriWaveContainerRef}
                className="rounded-xl p-4 overflow-hidden w-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <ReactSiriwave {...siriWaveConfig} />
            </motion.div>

            <button
                onClick={handleToggleCall}
                className="
                  w-14 h-14 md:w-16 md:h-16 
                  rounded-full
                  bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 
                  p-2.5 md:p-3
                  shadow-[0_0_15px_5px_rgba(128,0,128,0.4),_0_0_30px_10px_rgba(0,0,255,0.3)] 
                  animate-pulse-glow 
                  hover:shadow-[0_0_20px_8px_rgba(128,0,128,0.6),_0_0_40px_15px_rgba(0,0,255,0.4)] 
                  hover:scale-105 
                  transition-all duration-300 ease-in-out
                  flex items-center justify-center
                  relative
                  z-10
                  flex-shrink-0
                  mt-2
                "
                aria-label="Chat with AI Host via Voice"
                title="Chat with AI Host"
            >
                {!isSessionActive ? (
                    <MicVocal className="w-7 h-7 md:w-8 md:h-8 text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                ) : (
                    <PhoneCall className="w-7 h-7 md:w-8 md:h-8 text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                )}
            </button>
        </div>
    );
};

export default VoiceConsole;