
type NoteSide = "TOP" | "RIGHT" | "BOTTOM" | "LEFT"

interface Arrow {
	id: string;
	board_id: string;
	author_id: string;
	start_note_id: string;
	start_note_side: NoteSide;
	end_note_id: string;
	end_note_side: NoteSide;
	// add: some styling stuff
}
