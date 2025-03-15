import React from "react";
import clsx from "clsx";
import { Track } from "../data";
import useGlobalState from "../GlobalState";
interface LibrarySongProps {
	track: Track;
}

const LibrarySong: React.FC<LibrarySongProps> = ({ 
	track, 
}) => {
	// Function
	const { currentTrack, setCurrentTrack } = useGlobalState();
	const selectTrackHandler = async (): Promise<void> => {
		setCurrentTrack({ ...track, currentTime: 0, duration: 0 });
	};

	return (
		<div 
			onClick={selectTrackHandler} 
			className={clsx(
				"px-8 h-[100px] w-full flex transition-all duration-300 ease-in-out hover:bg-lightblue",
				track.id === currentTrack.id ? "bg-pink" : "bg-white"
			)}
		>
			<img 
				src={track.cover} 
				alt={track.name}
				className="my-5 h-[60px]"
			/>
			<div className="w-full h-full flex flex-col justify-center">
				<h3 className="pl-4 text-base">{track.name}</h3>
				<h4 className="pl-4 text-xs">{track.artist}</h4>
			</div>
		</div>
	);
};

export default LibrarySong;
