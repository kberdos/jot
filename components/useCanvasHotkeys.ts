"use client";

import { useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";

import {
	deleteSavedArrow,
	deleteSavedArrowsForNote,
	useArrowStore,
} from "@/util/objects/arrow";
import { Board } from "@/util/objects/board";
import { deleteSavedNote, Note, saveNote, useNoteStore } from "@/util/objects/note";
import { deleteSavedSection } from "@/util/objects/section";

type UseCanvasHotkeysProps = {
	activeNoteId: string | null;
	activeArrowId: string | null;
	activeSectionId: string | null;
	updateNote: (id: string, changes: Partial<Note>) => void;
	deleteNote: (id: string) => void;
	deleteArrow: (id: string) => void;
	deleteSection: (id: string) => void;
	deleteArrowsForNote: (noteId: string) => void;
	board: Board | undefined;
	user: User | undefined;
	handleEscape: () => void;
}

export function useCanvasHotkeys(props: UseCanvasHotkeysProps) {
	const {
		activeNoteId,
		activeArrowId,
		activeSectionId,
		updateNote,
		deleteNote,
		deleteArrow,
		deleteSection,
		deleteArrowsForNote,
		board,
		user,
		handleEscape,
	} = props

	const activeNoteIdRef = useRef(activeNoteId)
	const activeArrowIdRef = useRef(activeArrowId)
	const activeSectionIdRef = useRef(activeSectionId)
	const updateNoteRef = useRef(updateNote)
	const deleteNoteRef = useRef(deleteNote)
	const deleteArrowRef = useRef(deleteArrow)
	const deleteSectionRef = useRef(deleteSection)
	const deleteArrowsForNoteRef = useRef(deleteArrowsForNote)

	useEffect(() => {
		activeNoteIdRef.current = activeNoteId
		activeArrowIdRef.current = activeArrowId
		activeSectionIdRef.current = activeSectionId
		updateNoteRef.current = updateNote
		deleteNoteRef.current = deleteNote
		deleteArrowRef.current = deleteArrow
		deleteSectionRef.current = deleteSection
		deleteArrowsForNoteRef.current = deleteArrowsForNote
	}, [
		activeNoteId,
		activeArrowId,
		activeSectionId,
		updateNote,
		deleteNote,
		deleteArrow,
		deleteSection,
		deleteArrowsForNote,
	])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleEscape()
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				const target = e.target

				const isEditingText =
					target instanceof HTMLElement &&
					(target.closest("input, textarea") || target.isContentEditable)

				if (isEditingText) return

				const noteId = activeNoteIdRef.current
				const arrowId = activeArrowIdRef.current
				const sectionId = activeSectionIdRef.current

				if (!noteId && !arrowId && !sectionId) return

				e.preventDefault()

				if (noteId) {
					deleteArrowsForNoteRef.current(noteId)
					deleteNoteRef.current(noteId)

					deleteSavedArrowsForNote(noteId, board!.id, user!.id).catch((error) => {
						console.error("Failed to delete arrows for note:", error)
					})

					deleteSavedNote(noteId, board!.id, user!.id).catch((error) => {
						console.error("Failed to delete note:", error)
					})
				} else if (arrowId) {
					const arrow = useArrowStore.getState().arrows.find((a) => a.id === arrowId)
					deleteArrowRef.current(arrowId)

					deleteSavedArrow(arrowId, arrow?.board_id ?? board!.id, user!.id).catch((error) => {
						console.error("Failed to delete arrow:", error)
					})
				} else if (sectionId) {
					const sectionNotes = useNoteStore
						.getState()
						.notes.filter((note) => note.section_id === sectionId)

					sectionNotes.forEach((note) => {
						updateNoteRef.current(note.id, {
							section_id: null,
							last_modified_by: user!.id,
						})
					})
					deleteSectionRef.current(sectionId)

					Promise.all([
						...sectionNotes.map((note) =>
							saveNote({
								...note,
								section_id: null,
								last_modified_by: user!.id,
							}),
						),
						deleteSavedSection(sectionId, board!.id, user!.id),
					]).catch((error) => {
						console.error("Failed to delete section:", error)
					})
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [board, handleEscape, user])
}
