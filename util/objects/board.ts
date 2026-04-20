import { create } from "zustand"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/util/supabase/supabase"

export interface Board {
	id: string; /* UID for this board */
	name: string; /* name of the board */
	author_id: string /* OAuth user ID of board author / owner */
}

interface BoardStore {
	board?: Board,
	setBoard: (id: string) => void; // gather from database
	renameBoard: (name: string) => Promise<void>;
	createBoard: (name: string, user: User) => Promise<Board>;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
	board: undefined,
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
			board: data,
		}))
	},
	// TODO: prob just a rename board and sync with database
	renameBoard: async (name: string) => {
		const { board } = get()
		if (!board) return
		set(_ => ({
			board: {
				...board,
				name: name,
			},
		}))
		const { data, error } = await supabase
			.from("boards")
			.upsert({
				id: board.id,
				name: name,
			}, { onConflict: 'id' })

		if (error) throw error
	},
	createBoard: async (name: string, user: User) => {
		// make the board with supabasse
		const { data: board, error } = await supabase
			.from("boards")
			.insert({
				name, author: user.id
			})
			.select()
			.single()

		// XXX: go to a 404 instead of throw error
		if (error) throw error
		// write every note to the board

		return board
	},
}))
