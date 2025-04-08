import React from "react";
import clsx from "clsx";
import { CurrentStory } from "../DeviceState";

interface StoryCoverProps {
	currentStory: CurrentStory;
	isPlaying?: boolean;
}

const StoryCover: React.FC<StoryCoverProps> = ({
	currentStory,
	isPlaying = false,
}) => {
	const micActive = false
	return (
		<div className="mt-[10vh] min-h-[50vh] max-h-[60vh] flex flex-col items-center justify-center">
			<img
				src={currentStory.thumbnailUrl}
				alt={currentStory.title}
				className={clsx(
					"w-[20%] rounded-full transition-all duration-500",
					isPlaying && !micActive && "animate-spin-slow",
					micActive && "grayscale brightness-[60%]"
				)}
			/>
			<h2 className="py-3 px-1 mt-4">{currentStory.title}</h2>
			<h3 className="text-base font-normal text-gray-500">{currentStory.artist}</h3>
		</div>
	);
};

export default StoryCover;
