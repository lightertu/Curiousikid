"use client";

import React from "react";
import clsx from "clsx";

// Import components
import Player from "./components/Player";
import Library from "./components/Library";
import Nav from "./components/Nav";
import useGlobalState from "./GlobalState";
// Define interfaces
//
const App: React.FC = () => {
	const { libraryStatus } = useGlobalState();

	return (
		<div className={clsx(
			"flex flex-col justify-center transition-all duration-500 ease-in-out",
			libraryStatus ? "md:ml-80" : "ml-0",
			"max-md:ml-0"
		)}>
			<Nav />
			<Player />
			<Library />
		</div>
	);
};

export default App;
