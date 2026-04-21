import { NoteSide } from "./note";

export interface Arrow {
	id: string;
	board_id: string;
	author_id: string;
	start_note_id: string;
	start_note_side: NoteSide;
	end_note_id: string;
	end_note_side: NoteSide;
	// add: some styling stuff
}


interface ArrowStore {
	arrows: Arrow[],
	getArrow: (id: string) => Arrow | undefined;
}
