import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faPlay, faPause, faMicrophone } from "@fortawesome/free-solid-svg-icons";
import StoryCover from "./StoryCover";
import { Song } from "../data";
import { VoiceConsole } from "./livekit/VoiceConsole";
import clsx from "clsx";
import { RefObject, useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useRoomContext } from "@livekit/components-react";

interface PlayerProps {
	currentSong: Song;
	setCurrentSong: React.Dispatch<React.SetStateAction<Song>>;
	isPlaying: boolean;
	setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
	audioRef: RefObject<HTMLAudioElement | null>;
	songInfo: {
		currentTime: number;
		duration: number;
	};
	setSongInfo: React.Dispatch<React.SetStateAction<{
		currentTime: number;
		duration: number;
	}>>;
	songs: Song[];
	setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
	connectToLiveKit: () => Promise<void>;
}

interface TrackProps {
	currentSong: Song;
}

interface AnimateTrackProps {
	songInfo: {
		currentTime: number;
		duration: number;
	};
}

const Player: React.FC<PlayerProps> = ({
	currentSong,
	setCurrentSong,
	isPlaying,
	setIsPlaying,
	audioRef,
	songInfo,
	setSongInfo,
	songs,
	setSongs,
	connectToLiveKit,
}) => {
	// Add a new state to track microphone active state
	const [micActive, setMicActive] = useState<boolean>(false);
	const [progressWidth, setProgressWidth] = useState<number>(0);
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const room = useRoomContext();
	
	// Use effect to handle smooth progress bar animation using setInterval
	useEffect(() => {
		// Clear any existing interval
		if (progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}
		
		// If playing, start a new interval to update progress
		if (isPlaying && audioRef.current && songInfo.duration) {
			progressInterval.current = setInterval(() => {
				if (audioRef.current && songInfo.duration) {
					const currentPercent = (audioRef.current.currentTime * 100) / songInfo.duration;
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
	}, [isPlaying, audioRef, songInfo.duration]);
	
	// Update progress immediately when songInfo changes
	useEffect(() => {
		if (songInfo.duration) {
			const currentPercent = (songInfo.currentTime * 100) / songInfo.duration;
			setProgressWidth(currentPercent);
		}
	}, [songInfo]);
	
	// Event handlers with disabled state handling
	const playSongHandler = (): void => {
		if (isPlaying && audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(!isPlaying);
		} else if (audioRef.current) {
			audioRef.current.play();
			setIsPlaying(!isPlaying);
		}
	};

	// Add new handler for microphone toggle
	const toggleMicHandler = async (): Promise<void> => {
		if (micActive) {
			await handleDeactivateMic();
		} else {
			await handleActivateMic();
		}
	};
	
	const handleActivateMic = async () => {
		if (isPlaying && audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
		}
		
		try {
			await connectToLiveKit();
			setMicActive(true);
		} catch (error) {
			console.error("Failed to connect microphone:", error);
		}
	}
	
	const handleDeactivateMic = async () => {
		try {
			await handleDisconnect();
			playSongHandler();
			setMicActive(false);
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
		if (audioRef.current) {
			audioRef.current.currentTime = Number(e.target.value);
			setSongInfo({ ...songInfo, currentTime: Number(e.target.value) });
		}
	};

	const skipTrackHandler = async (direction: string): Promise<void> => {
		const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
		if (direction === "skip-forward") {
			await setCurrentSong(songs[(currentIndex + 1) % songs.length]);
			activeLibraryHandler(songs[(currentIndex + 1) % songs.length]);
		} else if (direction === "skip-back") {
			if ((currentIndex - 1) % songs.length === -1) {
				await setCurrentSong(songs[songs.length - 1]);
				activeLibraryHandler(songs[songs.length - 1]);
			} else {
				await setCurrentSong(songs[(currentIndex - 1) % songs.length]);
				activeLibraryHandler(songs[(currentIndex - 1) % songs.length]);
			}
		}
		if (isPlaying && audioRef.current) {
			audioRef.current.play();
		}
	};

	const activeLibraryHandler = (newSong: Song): void => {
		const newSongs = songs.map((song) => {
			if (song.id === newSong.id) {
				return {
					...song,
					active: true,
				};
			} else {
				return {
					...song,
					active: false,
				};
			}
		});
		setSongs(newSongs);
	};
	
	const handleDisconnect = async () => {
		await room?.disconnect();
	}
	return (
		<>
			{micActive ? (
				<VoiceConsole />
			) : (
				<StoryCover currentSong={currentSong} isPlaying={isPlaying} />
			)}
			<div className="min-h-[14vh] flex flex-col items-center justify-between">
				<div className={clsx(
					"w-1/2 flex items-center md:w-[40%]",
					micActive && "opacity-50 pointer-events-none"
				)}>
					<p className="px-4">{getTime(songInfo.currentTime || 0)}</p>
					<div className="relative w-full h-4 rounded-full overflow-hidden"
						 style={{background: `linear-gradient(to right, ${currentSong.color[0]}, ${currentSong.color[1]})`}}>
						{/* Progress overlay - positioned behind the input */}
						<div 
							className="bg-[rgb(204,204,204)] w-full h-full absolute top-0 left-0 z-0 pointer-events-none"
							style={{transform: `translateX(${progressWidth}%)`}}
						></div>
						
						{/* Input on top with z-index to ensure it receives clicks */}
						<input
							onChange={micActive ? undefined : dragHandler}
							min={0}
							max={songInfo.duration || 0}
							value={songInfo.currentTime}
							type="range"
							className="w-full h-full absolute top-0 left-0 appearance-none bg-transparent cursor-pointer focus:outline-none z-10
									[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:w-0 
									[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:opacity-0 [&::-moz-range-thumb]:border-none"
						/>
					</div>
					<p className="px-4">{getTime(songInfo.duration || 0)}</p>
				</div>

				<div className="flex justify-between items-center p-4 w-[25%] md:w-[25%]">
					<button 
						onClick={micActive ? undefined : () => skipTrackHandler("skip-back")}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							micActive 
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
						onClick={micActive ? undefined : playSongHandler}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							micActive 
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
							micActive 
								? "bg-black/15 shadow-inner translate-y-0.5 text-blue-500" 
								: "hover:bg-black/10 hover:shadow-inner hover:translate-y-0.5"
						)}
					>
						<FontAwesomeIcon
							className="mic"
							icon={faMicrophone}
							size="2x"
						/>
					</button>
					
					<button 
						onClick={micActive ? undefined : () => skipTrackHandler("skip-forward")}
						className={clsx(
							"flex items-center justify-center rounded-lg w-12 h-12 transition-all duration-200",
							micActive 
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
		</>
	);
};



export default Player;
