import { v4 as uuidv4 } from "uuid";

// Define the Song interface
export interface Song {
	name: string;
	cover: string;
	artist: string;
	audio: string;
	color: string[];
	id: string;
	active: boolean;
}

function chillHop(): Song[] {
	return [
		{
			name: "Birdy on the Ski Slopes",
			cover: "https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?",
			artist: "Storynory",
			audio: "/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
			color: ["#205950", "#2ab3bf"],
			id: uuidv4(),
			active: true,
		},
		//ADD MORE HERE
	];
}

export default chillHop;
