import React, { RefObject, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faPlay, faPause, faMicrophone } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import StoryCover from "./StoryCover";
import { Song, Song as SongType } from "../data";
// Define interfaces
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

const IconButton = styled.div<{ isActive?: boolean; isDisabled?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	width: 48px;
	height: 48px;
	transition: all 0.2s ease;
	cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
	opacity: ${props => props.isDisabled ? 0.5 : 1};
	
	&:hover {
		background-color: ${props => props.isDisabled ? 'transparent' : 'rgba(0, 0, 0, 0.1)'};
		box-shadow: ${props => props.isDisabled ? 'none' : 'inset 0 3px 5px rgba(0, 0, 0, 0.2)'};
		transform: ${props => props.isDisabled ? 'none' : 'translateY(1px)'};
	}
	
	&.active {
		background-color: rgba(0, 0, 0, 0.15);
		box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.3);
		transform: translateY(2px);
		color: #2196F3;
	}
`;

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
}) => {
	// Add a new state to track microphone active state
	const [isMicActive, setIsMicActive] = useState<boolean>(false);
	
	// Event handlers with disabled state handling
	const playSongHandler = (): void => {
		if (isMicActive) return; // Don't do anything if mic is active
		
		if (isPlaying && audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(!isPlaying);
		} else if (audioRef.current) {
			console.log(audioRef.current.src);
			audioRef.current.play();
			setIsPlaying(!isPlaying);
		}
	};

	// Add new handler for microphone toggle
	const toggleMicHandler = (): void => {
		setIsMicActive(!isMicActive);
		
		// If activating mic, pause any playing audio
		if (!isMicActive && isPlaying && audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
		}
		
		console.log("Microphone is now:", !isMicActive ? "active" : "inactive");
	};

	const togglePlayPauseIcon = () => {
		if (isPlaying) {
			return faPause;
		} else {
			return faPlay;
		}
	};

	const getTime = (time: number): string => {
		let minute = Math.floor(time / 60);
		let second = ("0" + Math.floor(time % 60)).slice(-2);
		return `${minute}:${second}`;
	};

	const dragHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
		if (audioRef.current) {
			audioRef.current.currentTime = Number(e.target.value);
			setSongInfo({ ...songInfo, currentTime: Number(e.target.value) });
		}
	};

	const skipTrackHandler = async (direction: string): Promise<void> => {
		if (isMicActive) return; // Don't do anything if mic is active
		
		let currentIndex = songs.findIndex((song) => song.id === currentSong.id);
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

	return (
		<>
		{/* <StoryCover currentSong={currentSong} /> */}

		<VoiceConsole />
		<PlayerContainer>
			<TimeControlContainer isDisabled={isMicActive}>
				<P isDisabled={isMicActive}>{getTime(songInfo.currentTime || 0)}</P>
				<Track currentSong={currentSong}>
					<Input
						onChange={isMicActive ? undefined : dragHandler}
						min={0}
						max={songInfo.duration || 0}
						value={songInfo.currentTime}
						type="range"
						isDisabled={isMicActive}
					/>
					<AnimateTrack songInfo={songInfo}></AnimateTrack>
				</Track>
				<P isDisabled={isMicActive}>{getTime(songInfo.duration || 0)}</P>
			</TimeControlContainer>

			<PlayControlContainer>
				<IconButton 
					onClick={isMicActive ? undefined : () => skipTrackHandler("skip-back")}
					isDisabled={isMicActive}
				>
					<FontAwesomeIcon
						className="skip-back"
						icon={faAngleLeft}
						size="2x"
					/>
				</IconButton>
				
				<IconButton 
					onClick={isMicActive ? undefined : playSongHandler}
					isDisabled={isMicActive}
				>
					<FontAwesomeIcon
						className="play"
						icon={togglePlayPauseIcon()}
						size="2x"
					/>
				</IconButton>
				
				<IconButton 
					onClick={toggleMicHandler}
					isActive={isMicActive}
					className={isMicActive ? "active" : ""}
				>
					<FontAwesomeIcon
						className="mic"
						icon={faMicrophone}
						size="2x"
					/>
				</IconButton>
				
				<IconButton 
					onClick={isMicActive ? undefined : () => skipTrackHandler("skip-forward")}
					isDisabled={isMicActive}
				>
					<FontAwesomeIcon
						className="skip-forward"
						icon={faAngleRight}
						size="2x"
					/>
				</IconButton>
				</PlayControlContainer>
			</PlayerContainer>
		</>
	);
};

const PlayerContainer = styled.div`
	min-height: 20vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
`;

const TimeControlContainer = styled.div<{ isDisabled?: boolean }>`
	width: 50%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	opacity: ${props => props.isDisabled ? 0.5 : 1};
	transition: opacity 0.3s ease;
	
	@media screen and (max-width: 768px) {
		width: 90%;
	}
`;

const Track = styled.div<TrackProps>`
	background: lightblue;
	width: 100%;
	height: 1rem;
	position: relative;
	border-radius: 1rem;
	overflow: hidden;
	background: linear-gradient(to right, ${(p) => p.currentSong.color[0]}, ${(p) => p.currentSong.color[1]});
`;

const AnimateTrack = styled.div<AnimateTrackProps>`
	background: rgb(204, 204, 204);
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
	transform: translateX(${(p) => Math.round((p.songInfo.currentTime * 100) / p.songInfo.duration) + "%"});
	pointer-events: none;
`;

const Input = styled.input<{ isDisabled?: boolean }>`
	width: 100%;
	-webkit-appearance: none;
	background: transparent;
	cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
	/* padding-top: 1rem;
	padding-bottom: 1rem; */
	&:focus {
		outline: none;
		-webkit-appearance: none;
	}
	@media screen and (max-width: 768px) {
		&::-webkit-slider-thumb {
			height: 48px;
			width: 48px;
		}
	}
	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 16px;
		width: 16px;
		background: transparent;
		border: none;
	}
	&::-moz-range-thumb {
		-webkit-appearance: none;
		background: transparent;
		border: none;
	}
	&::-ms-thumb {
		-webkit-appearance: none;
		background: transparent;
		border: none;
	}
	&::-moz-range-thumb {
		-webkit-appearance: none;
		background: transparent;
		border: none;
	}
`;

const P = styled.p<{ isDisabled?: boolean }>`
	padding: 1rem;
	opacity: ${props => props.isDisabled ? 0.7 : 1};
`;

const PlayControlContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem;
	width: 30%;
	@media screen and (max-width: 768px) {
		width: 60%;
	}
`;

export default Player;
