import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "869ef2f1-d788-4245-ad19-0c41982f0eed"; // Replace with your actual public key
const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "5a4ac2cc-cd67-4e02-9945-71dc7094194f"; // Replace with your actual assistant ID

const useVapi = () => {
    const [aiVolumeLevel, setAiVolumeLevel] = useState(0); // AI Assistant's volume
    const [userVolumeLevel, setUserVolumeLevel] = useState(0); // User's microphone volume
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [conversation, setConversation] = useState<
        { role: string; text: string; timestamp: string; isFinal: boolean }[]
    >([]);
    const vapiRef = useRef<any>(null);

    // Refs for user audio processing
    const userAudioContextRef = useRef<AudioContext | null>(null);
    const userAnalyserNodeRef = useRef<AnalyserNode | null>(null);
    const userMediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const userMicrophoneStreamRef = useRef<MediaStream | null>(null);
    const userVolumeAnimationRef = useRef<number | null>(null);

    const processUserAudio = useCallback(() => {
        if (userAnalyserNodeRef.current) {
            const dataArray = new Uint8Array(userAnalyserNodeRef.current.frequencyBinCount);
            userAnalyserNodeRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            console.log('[useVapi] Raw User Mic Average:', average, 'Normalized User Volume:', average / 128.0); // DEBUG LOG
            setUserVolumeLevel(average / 128.0); // Normalize (0-255 range, scale to ~0-2, then ReactSiriwave can scale it down further if needed)
            userVolumeAnimationRef.current = requestAnimationFrame(processUserAudio);
        } else {
            if (userVolumeAnimationRef.current) {
                cancelAnimationFrame(userVolumeAnimationRef.current);
                userVolumeAnimationRef.current = null;
            }
            setUserVolumeLevel(0);
        }
    }, []); // No dependencies as it relies on refs and setUserVolumeLevel

    const stopUserVolumeMonitoring = useCallback(() => {
        if (userVolumeAnimationRef.current) {
            cancelAnimationFrame(userVolumeAnimationRef.current);
            userVolumeAnimationRef.current = null;
        }
        userMicrophoneStreamRef.current?.getTracks().forEach(track => track.stop());
        userMediaStreamSourceRef.current?.disconnect();
        userAnalyserNodeRef.current?.disconnect();
        if (userAudioContextRef.current && userAudioContextRef.current.state !== 'closed') {
            userAudioContextRef.current.close().catch(err => console.error("Error closing user audio context:", err));
        }

        userMicrophoneStreamRef.current = null;
        userMediaStreamSourceRef.current = null;
        userAnalyserNodeRef.current = null;
        userAudioContextRef.current = null;
        setUserVolumeLevel(0);
    }, []); // No dependencies as it only uses refs and setUserVolumeLevel

    const startUserVolumeMonitoring = useCallback(async () => {
        if (userAudioContextRef.current || (vapiRef.current && vapiRef.current.isMuted())) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            userMicrophoneStreamRef.current = stream;
            const audioContext = new AudioContext();
            userAudioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            userAnalyserNodeRef.current = analyser;
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3; // Add some smoothing
            const source = audioContext.createMediaStreamSource(stream);
            userMediaStreamSourceRef.current = source;
            source.connect(analyser);
            if (userVolumeAnimationRef.current === null) { // Avoid multiple animation loops
                processUserAudio();
            }
        } catch (err) {
            console.error('Error starting user volume monitoring:', err);
            stopUserVolumeMonitoring();
        }
    }, [processUserAudio, stopUserVolumeMonitoring]);

    const initializeVapi = useCallback(() => {
        if (!vapiRef.current) {
            const vapiInstance = new Vapi(publicKey);
            vapiRef.current = vapiInstance;

            vapiInstance.on('call-start', () => {
                setIsSessionActive(true);
                setIsConnecting(false);
                if (!isMuted) startUserVolumeMonitoring(); // Start user volume monitoring if not muted
            });

            vapiInstance.on('call-end', () => {
                setIsSessionActive(false);
                setIsConnecting(false);
                setConversation([]);
                stopUserVolumeMonitoring();
            });

            vapiInstance.on('volume-level', (volume: number) => {
                setAiVolumeLevel(volume);
            });

            vapiInstance.on('message', (message: any) => {
                if (message.type === 'transcript') {
                    setConversation((prev) => {
                        const timestamp = new Date().toLocaleTimeString();
                        const updatedConversation = [...prev];
                        if (message.transcriptType === 'final') {
                            const partialIndex = updatedConversation.findIndex(
                                (msg) => msg.role === message.role && !msg.isFinal
                            );
                            if (partialIndex !== -1) {
                                updatedConversation[partialIndex] = {
                                    role: message.role,
                                    text: message.transcript,
                                    timestamp: updatedConversation[partialIndex].timestamp,
                                    isFinal: true,
                                };
                            } else {
                                updatedConversation.push({
                                    role: message.role,
                                    text: message.transcript,
                                    timestamp,
                                    isFinal: true,
                                });
                            }
                        } else {
                            const partialIndex = updatedConversation.findIndex(
                                (msg) => msg.role === message.role && !msg.isFinal
                            );
                            if (partialIndex !== -1) {
                                updatedConversation[partialIndex] = {
                                    ...updatedConversation[partialIndex],
                                    text: message.transcript,
                                };
                            } else {
                                updatedConversation.push({
                                    role: message.role,
                                    text: message.transcript,
                                    timestamp,
                                    isFinal: false,
                                });
                            }
                        }
                        return updatedConversation;
                    });
                }

                if (message.type === 'function-call' && message.functionCall.name === 'changeUrl') {
                    const command = message.functionCall.parameters.url.toLowerCase();
                    console.log(command);
                    if (command) {
                        window.location.href = command;
                    } else {
                        console.error('Unknown route:', command);
                    }
                }
            });

            vapiInstance.on('error', (e: Error) => {
                console.error('Vapi error:', e);
                setIsConnecting(false);
                stopUserVolumeMonitoring();
            });
        }
    }, [startUserVolumeMonitoring, stopUserVolumeMonitoring, isMuted]); // Added isMuted

    useEffect(() => {
        initializeVapi();
        return () => {
            if (vapiRef.current) {
                vapiRef.current.stop();
                vapiRef.current = null;
            }
            stopUserVolumeMonitoring();
        };
    }, [initializeVapi, stopUserVolumeMonitoring]);

    const toggleCall = async () => {
        if (isConnecting && !isSessionActive) return;
        try {
            if (isSessionActive) {
                setIsConnecting(false);
                await vapiRef.current.stop(); // call-end event will trigger stopUserVolumeMonitoring
            } else {
                setIsConnecting(true);
                await vapiRef.current.start(assistantId); // call-start event will trigger startUserVolumeMonitoring if not muted
            }
        } catch (err) {
            console.error('Error toggling Vapi session:', err);
            setIsConnecting(false);
            stopUserVolumeMonitoring(); // Ensure cleanup on direct error from toggleCall
        }
    };

    const sendMessage = (role: string, content: string) => {
        if (vapiRef.current) {
            vapiRef.current.send({
                type: 'add-message',
                message: { role, content },
            });
        }
    };

    const say = (message: string, endCallAfterSpoken = false) => {
        if (vapiRef.current) {
            vapiRef.current.say(message, endCallAfterSpoken);
        }
    };

    const toggleMute = () => {
        if (vapiRef.current) {
            const newMuteState = !isMuted;
            vapiRef.current.setMuted(newMuteState);
            setIsMuted(newMuteState);
            if (newMuteState) {
                stopUserVolumeMonitoring();
            } else {
                if (isSessionActive) startUserVolumeMonitoring(); // Only start if call is active
            }
        }
    };

    return {
        volumeLevel: aiVolumeLevel,
        userVolumeLevel,
        isSessionActive,
        isConnecting,
        conversation,
        toggleCall,
        sendMessage,
        say,
        toggleMute,
        isMuted
    };
};

export default useVapi