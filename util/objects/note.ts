import { create } from "zustand";
import { supabase } from "@/util/supabase/supabase";
import { User } from "@supabase/supabase-js";

export const DEFAULT_NOTE_WIDTH = 200;
// XXX: heights change dynamically based on text - can just use css styling
export const DEFAULT_NOTE_HEIGHT = 200;
const DEFAULT_NOTE_COLOR = "#FFF4BF";
const DEFAULT_NOTE_TYPE: NoteType = "idea";

export type NoteType = "question" | "idea";

export interface Note {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  board_id: string;
  author_id: string;
  author_name: string;
  last_modified_by: string | null;
  section_id?: string | null;
  type: NoteType;
}

export type NoteSide = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  highlightedNoteIds: string[];
  // TODO: get note
  updateNote: (id: string, changes: Partial<Note>) => void;
  setActiveNote: (id: string | null) => void;
  highlightNotes: (ids: string[]) => void;
  clearHighlightedNotes: () => void;
  deleteNote: (id: string) => void;
  loadNotes: (board_id: string) => Promise<void>;
  createNote: (
    x: number,
    y: number,
    board_id: string,
    user: User,
    type: NoteType,
  ) => Note;
  addNote: (note: Note) => void;
}

function getUserDisplayName(user: User): string {
  const metadata = user.user_metadata;
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : undefined;

  return name || user.email || "Unknown";
}

function normalizeNote(note: Note & { type?: string | null }): Note {
  return {
    ...note,
    text: note.text ?? "",
    author_name: note.author_name ?? "Unknown",
    last_modified_by: note.last_modified_by ?? null,
    type: note.type === "question" || note.type === "idea"
      ? note.type
      : DEFAULT_NOTE_TYPE,
  };
}

export async function saveNote(note: Note) {
  // XXX: maybe you can split this up into doing less
  const { error } = await supabase.from("notes").upsert(
    {
      id: note.id,
      x: note.x,
      y: note.y,
      color: note.color,
      width: note.width,
      height: note.height,
      text: note.text,
      board_id: note.board_id,
      author_id: note.author_id,
      author_name: note.author_name,
      last_modified_by: note.last_modified_by,
      section_id: note.section_id,
      type: note.type,
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[db:notes] save failed", {
      id: note.id,
      board_id: note.board_id,
      last_modified_by: note.last_modified_by,
      error,
    });
    throw error;
  }
}

export async function deleteSavedNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw error;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNoteId: null,
  highlightedNoteIds: [],
  updateNote: (id, changes) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
    }));
  },
  setActiveNote: (id) => {
    set((_) => ({
      activeNoteId: id,
    }));
  },
  highlightNotes: (ids) => {
    set((_) => ({
      highlightedNoteIds: Array.from(new Set(ids)),
    }));
  },
  clearHighlightedNotes: () => {
    set((_) => ({
      highlightedNoteIds: [],
    }));
  },
  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
      highlightedNoteIds: state.highlightedNoteIds.filter(
        (noteId) => noteId !== id,
      ),
    }));
  },
  loadNotes: async (board_id: string) => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("board_id", board_id);

    if (error) throw error;
    const notes = data as Note[];
    set((_) => ({
      notes: notes.map(normalizeNote),
    }));
  },
  createNote: (
    x,
    y,
    board_id: string,
    user: User,
    type: NoteType,
  ) => {
    const note = {
      id: crypto.randomUUID(),
      x: x,
      y: y,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      text: "",
      color: DEFAULT_NOTE_COLOR,
      board_id: board_id,
      author_id: user.id,
      author_name: getUserDisplayName(user),
      last_modified_by: user.id,
      type: type,
    };
    set((state) => ({
      notes: [...state.notes, note],
    }));
    return note;
  },
  // NOTE: this is used for adding notes pulled from database
  addNote: (note: Note) => {
    set((state) => ({
      notes: [
        ...state.notes,
        normalizeNote(note),
      ],
    }));
  },
}));
