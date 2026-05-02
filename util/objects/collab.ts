import { create } from "zustand";


export interface CollabCursor {
	user_id: string;
	user_email: string;
	user_name: string;
	// color: string;
	x: number;
	y: number;
	last_seen_at: number;
}

interface CollabStore {
	cursors: CollabCursor[];
	upsertCursor: (cursor: Partial<CollabCursor>) => void;
	removeCursor: (userId: string) => void;
	pruneStaleCursors: (olderThan: number) => void;
	clearCursors: () => void;
}

export const useCollabStore = create<CollabStore>((set, get) => ({
	cursors: [],
	upsertCursor: (cursor: Partial<CollabCursor>) => {
		const { cursors } = get()
		const nextCursor = {
			...cursor,
			last_seen_at: Date.now(),
		}
		if (!cursors.find((c) => c.user_id === cursor.user_id)) {
			set({
				cursors: [...cursors, nextCursor as CollabCursor]
			})
		} else {
			set(state => ({
				cursors: state.cursors.map(c => c.user_id === cursor.user_id ?
					{ ...c, ...nextCursor } : c),
			}))
		}
	},
	removeCursor: (userId: string) => {
		set(state => ({
			cursors: state.cursors.filter(cursor => cursor.user_id !== userId),
		}))
	},
	pruneStaleCursors: (olderThan: number) => {
		const cutoff = Date.now() - olderThan
		set(state => ({
			cursors: state.cursors.filter(cursor => cursor.last_seen_at >= cutoff),
		}))
	},
	clearCursors: () => {
		set({ cursors: [] })
	},
}))
