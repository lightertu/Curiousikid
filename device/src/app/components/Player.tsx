import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faPlay, faPause, faComments } from "@fortawesome/free-solid-svg-icons";
import StoryCover from "./StoryCover";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import TrackAudio from "./TrackAudio";
import useGlobalState, { CurrentStory } from "../GlobalState";
import AIVoiceModal from "./AIVoiceModal";
import { LiveKitApi } from "../api/livekit";
import { useConversationalStory } from "../hooks/useConversationalStory";

const Player: React.FC = () => {
	// Add a new state to track microphone active state
	const [progressWidth, setProgressWidth] = useState<number>(0);
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const { setCurrentStory, isPlaying, setIsPlaying, userId, setIsConnectingToLivekit, setLivekitConnectionDetails, isUserQuestionActive, setIsUserQuestionActive, setIsProactiveQuestionActive } = useGlobalState();
	const liveKitAPI = new LiveKitApi();
	const { clearProactiveQuestionPoint } = useConversationalStory();


	let { currentStory } = useGlobalState();
	currentStory = currentStory as CurrentStory;
	// Use effect to handle smooth progress bar animation using setInterval
	useEffect(() => {
		// Clear any existing interval
		if (!currentStory) return;
		if (progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		// If playing, start a new interval to update progress
		if (isPlaying && currentStory.duration) {
			progressInterval.current = setInterval(() => {
				if (currentStory.duration) {
					const currentPercent = (currentStory.currentTime * 100) / currentStory.duration;
					setProgressWidth(currentPercent);
				}
			}, 16); // ~60fps for smooth animation
		}

		// Cleanup on unmount or when dependencies change
		return () => {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
				progressInterval.current = null;
			}
		};
	}, [isPlaying, currentStory]);

	// Update progress immediately when songInfo changes
	useEffect(() => {
		if (!currentStory) return;
		if (currentStory.duration) {
			const currentPercent = (currentStory.currentTime * 100) / currentStory.duration;
			setProgressWidth(currentPercent);
		}
	}, [currentStory]);

	// Event handlers with disabled state handling
	const togglePlayback = (): void => {
		setIsPlaying(!isPlaying);
	};

	// Add new handler for microphone toggle
	const toggleMicHandler = async (): Promise<void> => {
		if (isUserQuestionActive) {
			await handleDeactivateMic();
		} else {
			await handleActivateMic();
		}
	};

	const handleActivateMic = async () => {
		try {
			clearProactiveQuestionPoint();
			console.log("Setting chat active");
			setIsUserQuestionActive(true);
			setIsProactiveQuestionActive(false);
			setIsPlaying(false);
			setIsConnectingToLivekit(true);
			const connectionDetails = await liveKitAPI.getConnectionDetails({
				agentType: "user_question",
				userId: userId,
				metadata: {
					storyId: currentStory.id,
					userId: userId,
					interruptAt: currentStory.currentTime,
				}
			});
			setLivekitConnectionDetails(connectionDetails);
		} catch (error) {
			console.error("Failed to connect microphone:", error);
		} finally {
			setIsConnectingToLivekit(false);
		}
	}

	const handleDeactivateMic = async () => {
		try {
			setIsUserQuestionActive(false);
			setIsPlaying(true);
			setIsConnectingToLivekit(false);
			setLivekitConnectionDetails(null);
		} catch (error) {
			console.error("Error disconnecting:", error);
		}
	}

	const togglePlayPauseIcon = () => {
		if (isPlaying) {
			return faPause;
		} else {
			return faPlay;
		}
	};

	const getTime = (time: number): string => {
		const minute = Math.floor(time / 60);
		const second = ("0" + Math.floor(time % 60)).slice(-2);
		return `${minute}:${second}`;
	};

	const dragHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setCurrentStory({ ...currentStory, currentTime: Number(e.target.value) });
	};

	const skipTrackHandler = async (direction: string): Promise<void> => {
		if (direction === "skip-forward") {
			//
		} else if (direction === "skip-back") {
			//
		}
		if (isPlaying) {
			setIsPlaying(!isPlaying);
		}
	};

	return (
		<>
			<StoryCover currentStory={currentStory} isPlaying={isPlaying} />
			<div className="min-h-[14vh] flex flex-col items-center justify-between">
				<div className={clsx(
					"w-1/2 flex items-center md:w-[40%]",
					isUserQuestionActive && "opacity-50 pointer-events-none"
				)}>
					<p className="px-4">{getTime(currentStory.currentTime || 0)}</p>
					<div className="relative w-full h-4 rounded-full overflow-hidden"
						style={{ background: `linear-gradient(to right, #205950, #2ab3bf)` }}>
						{/* Progress overlay - positioned behind the input */}
						<div
							className="bg-[rgb(204,204,204)] w-full h-full absolute top-0 left-0 z-0 pointer-events-none"
							style={{ transform: `translateX(${progressWidth}%)` }}
						></div>

						{/* Input on top with z-index to ensure it receives clicks */}
						<input
							onChange={isUserQuestionActive ? undefined : dragHandler}
							min={0}
							max={currentStory.duration || 0}
							value={currentStory.currentTime}
							type="range"
							className="w-full h-full absolute top-0 left-0 appearance-none bg-transparent cursor-pointer focus:outline-none z-10
									[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:w-0 
									[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:opacity-0 [&::-moz-range-thumb]:border-none"
						/>
					</div>
					<p className="px-4">{getTime(currentStory.duration || 0)}</p>
				</div>

				<div className="flex justify-between items-center p-4 w-[25%] md:w-[25%]">
					<button
						onClick={isUserQuestionActive ? undefined : () => skipTrackHandler("skip-back")}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							isUserQuestionActive
								? "opacity-50 cursor-not-allowed"
								: "hover:bg-black/10 hover:shadow-inner hover:translate-y-0.5 active:bg-black/15 active:shadow-inner active:translate-y-0.5"
						)}
					>
						<FontAwesomeIcon
							className="skip-back"
							icon={faAngleLeft}
							size="2x"
						/>
					</button>

					<button
						onClick={isUserQuestionActive ? undefined : togglePlayback}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							isUserQuestionActive
								? "opacity-50 cursor-not-allowed"
								: "hover:bg-black/10 hover:shadow-inner hover:translate-y-0.5 active:bg-black/15 active:shadow-inner active:translate-y-0.5"
						)}
					>
						<FontAwesomeIcon
							className="play"
							icon={togglePlayPauseIcon()}
							size="2x"
						/>
					</button>

					<button
						onClick={toggleMicHandler}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							isUserQuestionActive
								? "bg-black/15 shadow-inner translate-y-0.5 text-blue-500"
								: "hover:bg-black/10 hover:shadow-inner hover:translate-y-0.5"
						)}
					>
						<FontAwesomeIcon
							className="chat"
							icon={faComments}
							size="2x"
						/>
					</button>

					<button
						onClick={isUserQuestionActive ? undefined : () => skipTrackHandler("skip-forward")}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							isUserQuestionActive
								? "opacity-50 cursor-not-allowed"
								: "hover:bg-black/10 hover:shadow-inner hover:translate-y-0.5 active:bg-black/15 active:shadow-inner active:translate-y-0.5"
						)}
					>
						<FontAwesomeIcon
							className="skip-forward"
							icon={faAngleRight}
							size="2x"
						/>
					</button>
				</div>
			</div>
			<AIVoiceModal show={isUserQuestionActive} headline={`User Question ${isUserQuestionActive ? "Active" : "Inactive"}`} onDisconnect={() => {
				handleDeactivateMic();
			}} onConnect={() => {
			}} />
			<TrackAudio />
		</>
	);
};



export default Player;
