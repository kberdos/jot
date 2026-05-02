import { create } from "zustand"

interface ChatContextStore {
	noteContextIds: string[];
	addNoteContext: (id: string) => void;
	removeNoteContext: (id: string) => void;
	clearNoteContext: () => void;
}

export const useChatContextStore = create<ChatContextStore>((set) => ({
	noteContextIds: [],
	addNoteContext: (id) => {
		set(state => ({
			noteContextIds: state.noteContextIds.includes(id)
				? state.noteContextIds
				: [...state.noteContextIds, id],
		}))
	},
	removeNoteContext: (id) => {
		set(state => ({
			noteContextIds: state.noteContextIds.filter(noteId => noteId !== id),
		}))
	},
	clearNoteContext: () => {
		set({ noteContextIds: [] })
	},
}))
