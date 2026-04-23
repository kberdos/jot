import { create } from "zustand";


export interface CollabCursor {
	user_id: string;
	user_email: string;
	// color: string;
	x: number;
	y: number;
}

interface CollabStore {
	cursors: CollabCursor[];
	upsertCursor: (cursor: Partial<CollabCursor>) => void;
}

export const useCollabStore = create<CollabStore>((set, get) => ({
	cursors: [],
	upsertCursor: (cursor: Partial<CollabCursor>) => {
		const { cursors } = get()
		if (!cursors.find((c) => c.user_id === cursor.user_id)) {
			set(_ => ({
				cursors: [...cursors, cursor as CollabCursor]
			}))
		} else {
			set(state => ({
				cursors: state.cursors.map(c => c.user_id === cursor.user_id ?
					{ ...c, ...cursor } : c),
			}))
		}
	}
}))


