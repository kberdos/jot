import { create } from "zustand"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/util/supabase/supabase"
import { useAuthStore } from "@/util/auth/auth"

export interface Board {
	id: string; /* UID for this board */
	name: string; /* name of the board */
	author_id: string /* OAuth user ID of board author / owner */
	author?: string;
	owner_email?: string;
	last_modified_by: string | null;
	created_at: string | null;
	last_updated_at: string | null;
}


export function normalizeBoard(board: Board): Board {
	return {
		...board,
		created_at: board.created_at ?? null,
		last_updated_at: board.last_updated_at ?? null,
	}
}

export type BoardViewMode = "BOARD" | "TABLE"

interface BoardStore {
	board?: Board, // undefined while we're hydrating the page
	setBoard: (id: string) => Promise<void>; // gather from database
	renameBoard: (name: string) => Promise<void>;
	createBoard: (name: string, user: User) => Promise<Board>;
	isChatOpen: boolean;
	setIsChatOpen: (open: boolean) => void;
	viewMode: BoardViewMode;
	setViewMode: (mode: BoardViewMode) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
	board: undefined,

	isChatOpen: false,
	setIsChatOpen: (open: boolean) => set({ isChatOpen: open }),
	viewMode: "BOARD",
	setViewMode: (mode: BoardViewMode) => set({ viewMode: mode }),


	setBoard: async (id) => {
		// query board from supabase
		const { data, error } = await supabase
			.from("boards")
			.select("*")
			.eq("id", id)
			.single()

		// XXX: go to a 404 instead of throw error
		if (error) throw error

		set(_ => ({
			board: normalizeBoard(data as Board),
		}))
	},
	// TODO: prob just a rename board and sync with database
	renameBoard: async (name: string) => {
		const { board } = get()
		if (!board) return
		const userId = useAuthStore.getState().user?.id ?? board.last_modified_by
		const lastUpdatedAt = new Date().toISOString()
		set(_ => ({
			board: {
				...board,
				name: name,
				last_modified_by: userId,
				last_updated_at: lastUpdatedAt,
			},
		}))
		const { error } = await supabase
			.from('boards')
			.update({
				name: name,
				last_modified_by: userId,
				last_updated_at: lastUpdatedAt,
			})
			.eq('id', board.id)

		if (error) throw error
	},
	createBoard: async (name: string, user: User) => {
		// make the board with supabasse
		const now = new Date().toISOString()
		const board: Board = {
			id: crypto.randomUUID(),
			name,
			author: user.id,
			author_id: user.id,
			last_modified_by: user.id,
			created_at: null,
			last_updated_at: now,
		}
		const { error } = await supabase
			.from("boards")
			.insert({
				id: board.id,
				name,
				author: user.id,
				last_modified_by: user.id,
				last_updated_at: now,
			})

		// XXX: go to a 404 instead of throw error
		if (error) throw error

		return normalizeBoard(board)
	},
}))
