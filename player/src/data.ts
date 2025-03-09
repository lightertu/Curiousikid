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
			audio: "https://content.libsyn.com/p/c/e/a/cea6f8582aaa9396/birdy_on_the_ski_slopes-storynory-kaboom.mp3?c_id=185388280&cs_id=185388280&response-content-type=audio%2Fmpeg&Expires=1741546376&Signature=eYppTKQ~5Uvt~6Wwb0gRCLTLLnshq7t8h2stMcjx6wy02nkf9SzEICmTP8pmGGzXDQxd5D3DAO6QNSYtRw~W0R~6~A7eKUwMqesyyfQxL5znf5UMpzqqsv2CYVi7S4FMozMM6ZoZ9SU5H7TCgABfcf2CqFttnklsqbo59Of7GeZ46Vh2rgGSg1zpTjVWtLFz1FfYFhf3ZtSg48Z1CjR4e00LSC5W03fIjsygKp15hlLSG2pvbDqPh1Apht93by0coY6-vCa9XJTNiZMq5OWLEyqPdfBOzBba2BNWA5gzBqq9~DT~lbtvR3R9SjUGhRxsa29fo7DoQ87NXnJ3wqNOpw__&Key-Pair-Id=K1YS7LZGUP96OI",
			color: ["#205950", "#2ab3bf"],
			id: uuidv4(),
			active: true,
		},
		//ADD MORE HERE
	];
}

export default chillHop;
