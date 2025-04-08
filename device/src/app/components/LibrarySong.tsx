import React from "react";
import clsx from "clsx";
import useDeviceState from "../DeviceState";
import { StoryMetadata } from "../DeviceState";
interface LibraryProps {
	story: StoryMetadata;
}

const LibrarySong: React.FC<LibraryProps> = ({
	story,
}) => {
	// Function
	const { currentStory, setCurrentStory, setIsPlaying } = useDeviceState();
	const selectTrackHandler = async (): Promise<void> => {
		setCurrentStory({ ...story, currentTime: 0, });
	};

	return (
		<div
			onClick={selectTrackHandler}
			className={clsx(
				"px-8 py-2 h-[100px] w-full flex items-center transition-all duration-300 ease-in-out hover:bg-lightblue hover:shadow-lg",
				story?.id === currentStory?.id ? "bg-pink" : "bg-white"
			)}
		>
			<img
				src={story.thumbnailUrl}
				alt={story.title}
				className="h-[60px]"
			/>
			<div className="w-full h-full flex flex-col justify-center">
				<h3 className="pl-4 text-base">{story.title}</h3>
				<h4 className="pl-4 text-xs">{story.artist}</h4>
			</div>
		</div>
	);
};

export default LibrarySong;
