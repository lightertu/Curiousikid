"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicVocal, PhoneOff, Loader2 } from 'lucide-react';
import ReactSiriwave, { IReactSiriwaveProps } from 'react-siriwave';
import { motion } from 'framer-motion';
import useVapi from '@/components/hooks/use-vapi'; // Adjust the import path as needed

// Define CurveStyle type
type CurveStyle = "ios" | "ios9";

interface SiriProps {
    theme: CurveStyle;
}

const VoiceConsole: React.FC<SiriProps> = ({ theme }) => {
    const {
        volumeLevel,      // AI Assistant's volume
        userVolumeLevel,  // User's microphone volume
        isSessionActive,
        isConnecting,
        toggleCall
    } = useVapi();
    const siriWaveContainerRef = useRef<HTMLDivElement>(null);

    const [siriWaveConfig, setSiriWaveConfig] = useState<IReactSiriwaveProps>({
        theme: theme || "ios9",
        ratio: 1,
        speed: 0.2,       // Initial speed, will be overridden by effect
        amplitude: 0,     // Initial amplitude, will be overridden by effect
        frequency: 2,       // Initial frequency, will be overridden by effect
        color: '#9E9E9E',
        cover: true,
        width: 300,
        height: 100,
        autostart: true,
        pixelDepth: 1,
        lerpSpeed: 0.05,  // Reduced lerpSpeed for smoother transitions
    });

    const updateWidth = useCallback(() => {
        if (siriWaveContainerRef.current) {
            const containerWidth = siriWaveContainerRef.current.offsetWidth;
            const padding = 32;
            const newWidth = Math.max(0, containerWidth - padding);
            setSiriWaveConfig(prevConfig => {
                if (prevConfig.width !== newWidth) {
                    return { ...prevConfig, width: newWidth };
                }
                return prevConfig;
            });
        }
    }, [siriWaveContainerRef, setSiriWaveConfig]);

    useEffect(() => {
        updateWidth();

        window.addEventListener('resize', updateWidth);

        return () => {
            window.removeEventListener('resize', updateWidth);
        };
    }, [updateWidth]);

    useEffect(() => {
        let activeVolume = 0;
        let baseSpeed = 0.1;     // Default base speed
        let baseFrequency = 2;   // Default base frequency
        let baseAmplitude = 0.5; // Default base amplitude

        if (isSessionActive) {
            activeVolume = Math.max(volumeLevel, userVolumeLevel);
            if (activeVolume > 0.01) { // Significant speech detected
                baseSpeed = 0.1;     // Consistent, moderate speed for speech
                baseFrequency = 3;   // Consistent, moderate frequency for speech
                baseAmplitude = 80;  // Your preferred amplitude
            } else { // Session active, but quiet (pause)
                baseSpeed = 0.05;    // Slower speed for quiet moments
                baseFrequency = 2;   // Lower frequency for quiet moments
                baseAmplitude = 80;  // Maintain amplitude if you want a visible quiet pulse
            }
        } else if (isConnecting) { // Just connecting
            activeVolume = 0.01;
            baseSpeed = 0.1;
            baseFrequency = 2;
            baseAmplitude = 80;   // Your preferred amplitude for connecting pulse
        }

        const calculatedAmplitude = activeVolume > 0 ? baseAmplitude * Math.min(activeVolume * 7.5, 1.5) : 0;
        const calculatedSpeed = activeVolume > 0 ? baseSpeed // Using baseSpeed more directly, cap multiplier removed for now
            : 0;
        const calculatedFrequency = activeVolume > 0 ? baseFrequency // Using baseFrequency directly
            : 0;

        setSiriWaveConfig(prevConfig => ({
            ...prevConfig,
            amplitude: calculatedAmplitude,
            speed: calculatedSpeed,
            frequency: calculatedFrequency,
        }));
    }, [volumeLevel, userVolumeLevel, isSessionActive, isConnecting]);

    const handleToggleCall = () => {
        toggleCall();
    };

    const handleConfigChange = (key: keyof IReactSiriwaveProps, value: any) => {
        setSiriWaveConfig(prevConfig => ({
            ...prevConfig,
            [key]: value,
        }));
    };

    // Define button base classes that are always present
    const baseButtonClasses = "w-14 h-14 md:w-16 md:h-16 rounded-full p-2.5 md:p-3 flex items-center justify-center relative z-10 flex-shrink-0 mt-2 transition-all duration-300 ease-in-out";

    // Determine dynamic classes based on state
    let dynamicButtonClasses = "";
    if (isConnecting) {
        // Classes for connecting state (spinner is shown, glow is fine)
        dynamicButtonClasses = "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 shadow-[0_0_15px_5px_rgba(128,0,128,0.4),_0_0_30px_10px_rgba(0,0,255,0.3)] animate-pulse-glow hover:scale-105 hover:shadow-[0_0_20px_8px_rgba(128,0,128,0.6),_0_0_40px_15px_rgba(0,0,255,0.4)]";
    } else if (isSessionActive) {
        // Classes for active session (hang up - red, no glow)
        dynamicButtonClasses = "bg-red-600 hover:bg-red-700 shadow-md hover:scale-105";
    } else {
        // Classes for inactive session (chat with host - gradient, glow)
        dynamicButtonClasses = "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 shadow-[0_0_15px_5px_rgba(128,0,128,0.4),_0_0_30px_10px_rgba(0,0,255,0.3)] animate-pulse-glow hover:scale-105 hover:shadow-[0_0_20px_8px_rgba(128,0,128,0.6),_0_0_40px_15px_rgba(0,0,255,0.4)]";
    }

    return (
        // VoiceConsole root: takes full height of its allocated space, manages internal alignment
        <div className={`flex flex-col items-center w-full h-full justify-center`}>
            {/* Spacer to push SiriWave to center when active, or allow button to be centered when inactive */}
            {/* This div will take up space *above* the SiriWave when it's visible */}
            {(isConnecting || isSessionActive) && <div className="flex-grow-[1]"></div>}

            {/* Conditionally render the SiriWave container */}
            {(isConnecting || isSessionActive) && (
                <motion.div
                    ref={siriWaveContainerRef}
                    className="rounded-xl p-4 overflow-hidden w-full flex-shrink-0" // flex-shrink-0 to maintain its size
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onAnimationComplete={updateWidth}
                >
                    <ReactSiriwave {...siriWaveConfig} />
                </motion.div>
            )}

            {/* Wrapper for button and text, to be centered when SiriWave is hidden */}
            {/* Or pushed down when SiriWave is visible */}
            <div className={`flex flex-col items-center ${(isConnecting || isSessionActive) ? 'mt-4 flex-shrink-0' : 'flex-grow-[1] justify-center'}`}>
                <button
                    onClick={handleToggleCall}
                    className={`${baseButtonClasses} ${dynamicButtonClasses}`}
                    aria-label={isConnecting ? "Connecting call" : isSessionActive ? "Hang up call" : "Chat with AI Host via Voice"}
                    title={isConnecting ? "Connecting..." : isSessionActive ? "Hang Up" : "Chat with AI Host"}
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-white animate-spin" />
                    ) : !isSessionActive ? (
                        <MicVocal className="w-7 h-7 md:w-8 md:h-8 text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                    ) : (
                        <PhoneOff className="w-7 h-7 md:w-8 md:h-8 text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                    )}
                </button>

                <p className="text-xs text-neutral-400 mt-3">
                    {isConnecting ? "Connecting..." : isSessionActive ? "Hang Up" : "Chat with Host"}
                </p>
            </div>

            {/* Spacer to push button/text down when SiriWave is active and centered */}
            {/* This div will take up space *below* the button when SiriWave is visible */}
            {(isConnecting || isSessionActive) && <div className="flex-grow-[1]"></div>}
        </div>
    );
};

export default VoiceConsole;