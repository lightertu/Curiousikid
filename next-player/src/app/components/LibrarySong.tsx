import React, { RefObject } from "react";
import clsx from "clsx";
import { Song as SongType } from "../data";

interface LibrarySongProps {
	song: SongType;
	songs: SongType[];
	setCurrentSong: React.Dispatch<React.SetStateAction<SongType>>;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
	setSongs: React.Dispatch<React.SetStateAction<SongType[]>>;
}

const LibrarySong: React.FC<LibrarySongProps> = ({ 
	song, 
	setCurrentSong, 
	audioRef, 
	isPlaying, 
	songs, 
	setSongs 
}) => {
	// Function
	const songSelectHandler = async (): Promise<void> => {
		await setCurrentSong(song);
		const curSong = song;
		const songList = songs;

		const newSongs = songList.map((song) => {
			if (song.id === curSong.id) {
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

		// check if user is wanting to play a song.
		if (isPlaying && audioRef.current) {
			audioRef.current.play();
		}
	};

	return (
		<div 
			onClick={songSelectHandler} 
			className={clsx(
				"px-8 h-[100px] w-full flex transition-all duration-300 ease-in-out hover:bg-lightblue",
				song.active ? "bg-pink" : "bg-white"
			)}
		>
			<img 
				src={song.cover} 
				alt={song.name}
				className="my-5 h-[60px]"
			/>
			<div className="w-full h-full flex flex-col justify-center">
				<h3 className="pl-4 text-base">{song.name}</h3>
				<h4 className="pl-4 text-xs">{song.artist}</h4>
			</div>
		</div>
	);
};

export default LibrarySong;
