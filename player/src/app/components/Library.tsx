import React, { RefObject } from "react";
import LibrarySong from "./LibrarySong";
import clsx from "clsx";
import { Song as SongType } from "../data";

interface LibraryProps {
	songs: SongType[];
	setCurrentSong: React.Dispatch<React.SetStateAction<SongType>>;
	audioRef: RefObject<HTMLAudioElement | null>;
	isPlaying: boolean;
	setSongs: React.Dispatch<React.SetStateAction<SongType[]>>;
	libraryStatus: boolean;
}

const Library: React.FC<LibraryProps> = ({ 
	songs, 
	setCurrentSong, 
	audioRef, 
	isPlaying, 
	setSongs, 
	libraryStatus 
}) => {
	return (
		<div 
			className={clsx(
				"fixed z-10 top-0 left-0 w-100 h-full bg-white shadow-lg select-none overflow-scroll transition-all duration-500 ease-in-out",
				libraryStatus ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0", "library-scrollbar"
			)}
			style={{
				scrollbarWidth: 'thin',
				scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
			}}
		>
			<h2 className="p-8">Library</h2>
			<div className="flex flex-col bg-white">
				{songs.map((song) => (
					<LibrarySong
						song={song}
						songs={songs}
						setCurrentSong={setCurrentSong}
						key={song.id}
						audioRef={audioRef}
						isPlaying={isPlaying}
						setSongs={setSongs}
					/>
				))}
			</div>

			<style jsx>{`
				.library-scrollbar::-webkit-scrollbar {
					width: 5px;
				}
				.library-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.library-scrollbar::-webkit-scrollbar-thumb {
					background-color: rgba(155, 155, 155, 0.5);
					border-radius: 20px;
					border: transparent;
				}
			`}</style>
		</div>
	);
};

export default Library;
