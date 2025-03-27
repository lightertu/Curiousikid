import { v4 as uuidv4 } from "uuid";

// Define the Song interface
export interface Track {
	name: string;
	cover: string;
	artist: string;
	audio: string;
	id: string;
}

function chillHop(): Track[] {
	return [
		{
			name: "Birdy on the Ski Slopes",
			cover: "https://www.storynory.com/wp-content/uploads/2025/03/jake-ski-videoart-600x336.jpg?",
			artist: "Storynory",
			audio: "/birdy_on_the_ski_slopes-storynory-kaboom.mp3",
			id: uuidv4(),
		},
		//ADD MORE HERE
	];
}

export default chillHop;
