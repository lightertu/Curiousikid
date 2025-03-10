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
			audio: "https://content.libsyn.com/p/c/e/a/cea6f8582aaa9396/birdy_on_the_ski_slopes-storynory-kaboom.mp3?c_id=185388280&cs_id=185388280&response-content-type=audio%2Fmpeg&Expires=1741640826&Signature=TXytWLFWiZB44dLTf8hF7FezYqzxhqsWwv4ItUIlOr6EOdHMU9UjCRvif-Mt6~19QOyawE62zARdoQbrs3-sJmbsGJ4wd3KxiPQLsYImT72y~aBH0oEfA6BYDCqPx2MDBKkKstH~YoT5j1gP-DhHW1q9PfrxaIOPVfP7OVekux61iXpUVz2x-VSTsTnMbVcYTH2AtS1rzkYaQRDPFQJTLMlUQLWF78Eul22v6Lx3IKBRHOY-dgdxFioKiSxtjlj4Psi4Jvxe4ZWZsuVarBPO5v4ort~lPjO9j~jqcJvZcQND5RN2pItJt6bmNuBizfILECmEJs5-FKLfIi9oan5t0w__&Key-Pair-Id=K1YS7LZGUP96OI",
			color: ["#205950", "#2ab3bf"],
			id: uuidv4(),
			active: true,
		},
		//ADD MORE HERE
	];
}

export default chillHop;
