import { create } from "zustand"
import type { NoteType } from "./note"

export interface ChatMessage {
	role: "user" | "model";
	parts: [{ text: string }];
	contextNotes?: {
		id: string;
		text: string;
		author_name: string;
		color: string;
		type: NoteType;
	}[];
}

interface ChatContextStore {
	noteContextIds: string[];
	messages: ChatMessage[];
	input: string;
	addNoteContext: (id: string) => void;
	removeNoteContext: (id: string) => void;
	clearNoteContext: () => void;
	setMessages: (messages: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[])) => void;
	setInput: (input: string) => void;
	clearChat: () => void;
}

export const useChatContextStore = create<ChatContextStore>((set) => ({
	noteContextIds: [],
	messages: [],
	input: "",
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
	setMessages: (messages) => {
		set(state => ({
			messages: typeof messages === "function"
				? messages(state.messages)
				: messages,
		}))
	},
	setInput: (input) => {
		set({ input })
	},
	clearChat: () => {
		set({
			messages: [],
			input: "",
			noteContextIds: [],
		})
	},
}))
