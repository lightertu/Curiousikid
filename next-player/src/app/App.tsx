"use client";

import React, { useState, useRef } from "react";
import clsx from "clsx";

// Import components
import Player from "./components/Player";
import Library from "./components/Library";
import Nav from "./components/Nav";
// Import data
import data, { Song as SongType } from "./data";

// Define interfaces
interface SongInfo {
	currentTime: number;
	duration: number;
}

const App: React.FC = () => {
	// Ref
	const audioRef = useRef<HTMLAudioElement>(null);

	// State
	const [songs, setSongs] = useState<SongType[]>(data());
	const [currentSong, setCurrentSong] = useState<SongType>(songs[0]);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [libraryStatus, setLibraryStatus] = useState<boolean>(false);
	const [songInfo, setSongInfo] = useState<SongInfo>({
		currentTime: 0,
		duration: 0,
	});

	// Functions
	const updateTimeHandler = (e: React.SyntheticEvent<HTMLAudioElement>): void => {
		const target = e.target as HTMLAudioElement;
		const currentTime = target.currentTime;
		const duration = target.duration;
		setSongInfo({ ...songInfo, currentTime, duration });
	};

	const songEndHandler = async (): Promise<void> => {
		let currentIndex = songs.findIndex((song) => song.id === currentSong.id);
		let nextSong = songs[(currentIndex + 1) % songs.length];
		await setCurrentSong(nextSong);

		const newSongs = songs.map((song) => {
			if (song.id === nextSong.id) {
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

		if (isPlaying && audioRef.current) {
			audioRef.current.play();
		}
	};

	return (
		<div className={clsx(
			"flex flex-col justify-center transition-all duration-500 ease-in-out ml-80 md:ml-0"
		)}>
			<Nav libraryStatus={libraryStatus} setLibraryStatus={setLibraryStatus} />
			<Player
				isPlaying={isPlaying}
				setIsPlaying={setIsPlaying}
				currentSong={currentSong}
				setCurrentSong={setCurrentSong}
				audioRef={audioRef}
				songInfo={songInfo}
				setSongInfo={setSongInfo}
				songs={songs}
				setSongs={setSongs}
			/>
			<Library
				songs={songs}
				setCurrentSong={setCurrentSong}
				audioRef={audioRef}
				isPlaying={isPlaying}
				setSongs={setSongs}
				libraryStatus={libraryStatus}
			/>
			<audio
				onLoadedMetadata={updateTimeHandler}
				onTimeUpdate={updateTimeHandler}
				onEnded={songEndHandler}
				ref={audioRef}
				src={currentSong.audio}
			/>
		</div>
	);
};

export default App;
