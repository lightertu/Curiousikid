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
			audio: "https://content.libsyn.com/p/c/e/a/cea6f8582aaa9396/birdy_on_the_ski_slopes-storynory-kaboom.mp3?c_id=185388280&cs_id=185388280&response-content-type=audio%2Fmpeg&Expires=1741587745&Signature=GDD1h1tGUJuOhWUCJeXRZHApiF-UKybCit-7ylRzYYChp5y7kPoOPWuN75HJN9KEmhB6VVycSbUEgSNao0VjqkDk0ir6DEMTgElKQD2blMfNhiC-noahG0VN0zgUZrSKP0epBm9ISVo~Yh9LNa9UaPOgkWWwm1qStz8oesyNN5syV1xm-2wyXAUPeWpokj8Igjs-W~zAstxv8sITC-WdrqHEy8A6UXj8oLJpINXTKitAkdD-2rgGd~d8OPMFitJx0XjNmrIAJuEJWMZEqKO8iJSx8Y~QjrrvuY17Z-wpcS9iHrDQdaSATYOIjPAniogee48IM7-1rVEg7mTcIdN4WA__&Key-Pair-Id=K1YS7LZGUP96OI",
			color: ["#205950", "#2ab3bf"],
			id: uuidv4(),
			active: true,
		},
		//ADD MORE HERE
	];
}

export default chillHop;
