import React from "react";
import { Track } from "../data";
import clsx from "clsx";

interface StoryCoverProps {
	currentTrack: Track;
	isPlaying?: boolean;
}

const StoryCover: React.FC<StoryCoverProps> = ({ 
	currentTrack, 
	isPlaying = false,
}) => {
	const micActive = false 
	return (
		<div className="mt-[10vh] min-h-[50vh] max-h-[60vh] flex flex-col items-center justify-center">
			<img 
				src={currentTrack.cover} 
				alt={currentTrack.name}
				className={clsx(
					"w-[20%] rounded-full transition-all duration-500",
					isPlaying && !micActive && "animate-spin-slow",
					micActive && "grayscale brightness-[60%]"
				)}
			/>
			<h2 className="py-3 px-1 mt-4">{currentTrack.name}</h2>
			<h3 className="text-base font-normal text-gray-500">{currentTrack.artist}</h3>
		</div>
	);
};

export default StoryCover;
