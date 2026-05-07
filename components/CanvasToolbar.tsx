"use client";

import { RefObject } from "react";
import { User } from "@supabase/supabase-js";

import { AddArrowMode } from "@/util/objects/arrow";
import { Board } from "@/util/objects/board";
import { Camera } from "@/util/objects/camera";
import { Note, NoteType, saveNote } from "@/util/objects/note";
import { AddSectionMode } from "@/util/objects/section";

export type CanvasTool = "cursor" | "note" | "arrow" | "section"

type CanvasToolbarProps = {
	activeTool: CanvasTool;
	setActiveTool: (tool: CanvasTool) => void;
	clearSelections: () => void;
	resetToCursor: () => void;
	setAddArrowMode: (val: AddArrowMode) => void;
	setAddSectionMode: (val: AddSectionMode) => void;
	canvasRef: RefObject<HTMLDivElement | null>;
	camera: Camera;
	board: Board | undefined;
	user: User | undefined;
	createNote: (
		x: number,
		y: number,
		board_id: string,
		user: User,
		type: NoteType,
	) => Note;
}

export default function CanvasToolbar(props: CanvasToolbarProps) {
	const {
		activeTool,
		setActiveTool,
		clearSelections,
		resetToCursor,
		setAddArrowMode,
		setAddSectionMode,
		canvasRef,
		camera,
		board,
		user,
		createNote,
	} = props

	return (
		<div className="toolbar">
			<button
				
				className={`icon ${activeTool === "cursor" ? "active" : ""}`}
				onPointerDown={(e) => e.stopPropagation()}
				onClick={() => resetToCursor()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="38"
					height="38"
					viewBox="0 0 38 38"
					fill="none"
				>
					<path
						d="M11.0854 6.83698C9.59373 6.04573 7.8467 7.31745 8.13967 8.97898L12.1326 31.624C12.4664 33.5172 15.0027 33.9266 15.915 32.2338L20.2492 24.1939C20.4091 23.8976 20.6341 23.6413 20.9073 23.4443C21.1804 23.2473 21.4946 23.1147 21.8263 23.0565L30.9488 21.448C32.8499 21.1127 33.2523 18.5599 31.5449 17.6584L11.0854 6.83698Z"
						fill="black"
					/>
				</svg>
			</button>

			<div className={`note-wrapper ${activeTool === "note" ? "active" : ""}`}>
				<button
					onClick={(e) => {
						e.stopPropagation()
						clearSelections()
						setActiveTool("note")
					}}
					onPointerDown={(e) => e.stopPropagation()}
					className="icon"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="35"
						height="35"
						viewBox="0 0 35 35"
						fill="none"
					>
						<path
							d="M18.375 27.125H8.75C8.26875 27.125 7.875 26.7313 7.875 26.25V8.75C7.875 8.26875 8.26875 7.875 8.75 7.875H26.25C26.7313 7.875 27.125 8.26875 27.125 8.75V18.375H22.3125C20.1359 18.375 18.375 20.1359 18.375 22.3125V27.125ZM26.0367 21L21 26.0367V22.3125C21 21.5852 21.5852 21 22.3125 21H26.0367ZM5.25 26.25C5.25 28.1805 6.81953 29.75 8.75 29.75H19.5508C20.4805 29.75 21.3719 29.3836 22.0281 28.7273L28.7273 22.0227C29.3836 21.3664 29.75 20.475 29.75 19.5453V8.75C29.75 6.81953 28.1805 5.25 26.25 5.25H8.75C6.81953 5.25 5.25 6.81953 5.25 8.75V26.25Z"
							fill="black"
						/>
					</svg>
				</button>

				<div className="note-hover-menu">

					<button className="pill idea"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => {
								e.stopPropagation()
								console.log("hiiii")
								const rect = canvasRef.current!.getBoundingClientRect()

								// center of visible screen
								const screenX = rect.width / 2
								const screenY = rect.height / 2
							
								// convert to board coordinates
								const boardX = (screenX-camera.x) / camera.zoom
								const boardY = (screenY-camera.y) / camera.zoom
								const n = createNote(boardX, boardY, board!.id, user!, "idea")
								n.type = "idea"
								saveNote(n)
								setActiveTool("cursor")
							}}
							>Idea</button>
					<button className="pill question"
						onPointerDown={(e) => e.stopPropagation()}
						onClick={(e) => {
							e.stopPropagation()
							console.log("hello")
							const rect = canvasRef.current!.getBoundingClientRect()

							// center of visible screen
							const screenX = rect.width / 2
							const screenY = rect.height / 2

							// convert to board coordinates
							const boardX = (screenX - camera.x) / camera.zoom
							const boardY = (screenY - camera.y) / camera.zoom

							const n = createNote(boardX, boardY, board!.id, user!, "question")
							saveNote(n)
							setActiveTool("cursor")
						}}
					>Question</button>
				</div>
			</div>

			<button
				onClick={() => {
					clearSelections()
					setAddArrowMode("ACTIVE")
					setActiveTool("arrow")
				}}
				onPointerDown={(e) => e.stopPropagation()}
				className={`icon ${activeTool === "arrow" ? "active" : ""}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="29"
					viewBox="0 0 32 29"
				>
					<path
						d="M29 14.5001L19.5208 2.73215C19.3338 2.50003 19.1118 2.3159 18.8675 2.19028C18.6232 2.06466 18.3614 2 18.097 2C17.8326 2 17.5707 2.06466 17.3264 2.19028C17.0821 2.3159 16.8602 2.50003 16.6732 2.73215C16.4862 2.96427 16.3379 3.23984 16.2367 3.54312C16.1355 3.84639 16.0834 4.17145 16.0834 4.49971C16.0834 4.82798 16.1355 5.15303 16.2367 5.45631C16.3379 5.75959 16.4862 6.03516 16.6732 6.26728L21.291 12H6.01385C5.47975 12 4.96751 12.2634 4.58984 12.7322C4.21217 13.2011 4 13.837 4 14.5001C4 15.1631 4.21217 15.7991 4.58984 16.2679C4.96751 16.7368 5.47975 17.0002 6.01385 17.0002H21.291L16.6732 22.7329C16.4855 22.9645 16.3366 23.2399 16.235 23.5433C16.1334 23.8466 16.081 24.1719 16.081 24.5004C16.081 24.829 16.1334 25.1543 16.235 25.4576C16.3366 25.761 16.4855 26.0364 16.6732 26.268C17.0508 26.7367 17.563 27 18.097 27C18.631 27 19.1431 26.7367 19.5208 26.268L29 14.5001Z"
						fill="black"
					/>
				</svg>
			</button>

			<button
				className={`icon ${activeTool === "section" ? "active" : ""}`}
				onPointerDown={(e) => e.stopPropagation()}
				onClick={() => {
					clearSelections()
					setAddSectionMode("ACTIVE")
					setActiveTool("section")
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="30"
					height="30"
					viewBox="0 0 30 30"
				>
					<g clipPath="url(#clip0_74_275)">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M6.25 3.75C5.58696 3.75 4.95107 4.01339 4.48223 4.48223C4.01339 4.95107 3.75 5.58696 3.75 6.25V23.75C3.75 24.413 4.01339 25.0489 4.48223 25.5178C4.95107 25.9866 5.58696 26.25 6.25 26.25H23.75C24.413 26.25 25.0489 25.9866 25.5178 25.5178C25.9866 25.0489 26.25 24.413 26.25 23.75V6.25C26.25 5.58696 25.9866 4.95107 25.5178 4.48223C25.0489 4.01339 24.413 3.75 23.75 3.75H6.25ZM13.75 6.25H6.25V12.5H13.75V6.25ZM6.25 15H13.75C14.413 15 15.0489 14.7366 15.5178 14.2678C15.9866 13.7989 16.25 13.163 16.25 12.5V6.25H23.75V23.75H6.25V15Z"
							fill="black"
						/>
					</g>
					<defs>
						<clipPath id="clip0_74_275">
							<rect width="30" height="30" fill="white" />
						</clipPath>
					</defs>
				</svg>
			</button>
		</div>
	)
}
