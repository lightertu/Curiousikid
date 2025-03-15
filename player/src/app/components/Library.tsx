import React from "react";
import LibrarySong from "./LibrarySong";
import clsx from "clsx";
import useGlobalState from "../GlobalState";


const Library: React.FC = () => {
	const { tracks, libraryStatus } = useGlobalState();

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
				{tracks.map((track) => (
					<LibrarySong track={track} key={track.id}
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
