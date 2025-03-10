"use client";

import React, { useState, useRef, useCallback } from "react";
import clsx from "clsx";

// Import components
import Player from "./components/Player";
import Library from "./components/Library";
import Nav from "./components/Nav";
// Import data
import data, { Song as SongType } from "./data";
import styled from "styled-components";
import { LiveKitRoom } from "@livekit/components-react";
import { LiveKitAuthPutResponse } from "./api/livekit/auth/route";
import { v4 as uuidv4 } from 'uuid';
// Define interfaces
interface SongInfo {
	currentTime: number;
	duration: number;
}

interface AppContainerProps {
	libraryStatus: boolean;
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
	const [connectionDetails, setConnectionDetails] = useState<LiveKitAuthPutResponse | undefined>(
		undefined
	);

	// Functions
	const updateTimeHandler = (e: React.SyntheticEvent<HTMLAudioElement>): void => {
		const target = e.target as HTMLAudioElement;
		const currentTime = target.currentTime;
		const duration = target.duration;
		setSongInfo({ ...songInfo, currentTime, duration });
	};

	const songEndHandler = async (): Promise<void> => {
		const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
		const nextSong = songs[(currentIndex + 1) % songs.length];
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

	const handleConnectToLiveKit = useCallback(async () => {
		// Generate room connection details, including:
		//   - A random Room name
		//   - A random Participant name
		//   - An Access Token to permit the participant to join the room
		//   - The URL of the LiveKit server to connect to
		//
		// In real-world application, you would likely allow the user to specify their
		// own participant name, and possibly to choose from existing rooms to join.

		const url = new URL(
		  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/livekit/auth",
		  window.location.origin
		);
		const response = await fetch(url.toString(), {
		  method: "PUT",
		  headers: {"Content-Type": "application/json"},
		  body: JSON.stringify({
			participantId: "raytu",
			roomName: "raytu-test-" + uuidv4()
		  })
		});

		const connectionDetailsData = await response.json();
		setConnectionDetails(connectionDetailsData);
	  }, []
	);

	return (
		<div className={clsx(
			"flex flex-col justify-center transition-all duration-500 ease-in-out",
			libraryStatus ? "md:ml-80" : "ml-0",
			"max-md:ml-0"
		)}>
			<Nav libraryStatus={libraryStatus} setLibraryStatus={setLibraryStatus} />
		  	<LiveKitRoom
		  	  token={connectionDetails?.participantToken}
		  	  serverUrl={connectionDetails?.serverUrl}
		  	  connect={connectionDetails !== undefined}
		  	  audio={true}
		  	  video={false}
		  	  onMediaDeviceFailure={onDeviceFailure}
		  	  onDisconnected={() => {
		  	    setConnectionDetails(undefined);
		  	  }}
		  	  className="grid grid-rows-[2fr_1fr] items-center"
			>
				<Player
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					connectToLiveKit={handleConnectToLiveKit}
					currentSong={currentSong}
					setCurrentSong={setCurrentSong}
					audioRef={audioRef}
					songInfo={songInfo}
					setSongInfo={setSongInfo}
					songs={songs}
					setSongs={setSongs}
				/>
			</LiveKitRoom>
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

const AppContainer = styled.div<AppContainerProps>`
	transition: all 0.5s ease;
	margin-left: ${(p) => (p.libraryStatus ? "20rem" : "0")};
	@media screen and (max-width: 768px) {
		margin-left: 0;
	}
`;

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

export default App;
