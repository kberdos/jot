"use client"

import { useCameraStore } from "@/util/objects/camera"
import { saveNote, useNoteStore } from "@/util/objects/note"
import { handlePointerDown, handlePointerUp } from "@/util/pointerfunctions"
import NoteObj from "./NoteCard"
import { useBoardStore } from "@/util/objects/board"
import { useAuthStore } from "@/util/auth/auth"
import { ArrowLayer } from "./Arrow"
import { useArrowStore } from "@/util/objects/arrow"
import CollabLayer from "./Collab"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3


const Canvas = () => {
	const { camera, setCamera, resetCamera } = useCameraStore()
	const { notes, createNote } = useNoteStore()
	const { board, renameBoard } = useBoardStore()
	const { setAddMode } = useArrowStore()

	const { user } = useAuthStore()


	const handlePointerMove = (e: React.PointerEvent) => {
		if (e.buttons !== 1) return;
		setCamera({
			x: camera.x + e.movementX / camera.zoom,
			y: camera.y + e.movementY / camera.zoom,
		})
	}


	const handleRenameBoard = async () => {
		let name = prompt("Enter new name")
		if (name) {
			console.log(name)
			await renameBoard(name)
		}
	}

	return (
		<div className="w-full h-full overflow-hidden"
			style={{
				backgroundColor: "var(--light-grey)",
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)}px`,
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onWheel={(e) => {
				const zoomFactor = e.deltaY * 0.001
				const newZoom = Math.min(ZOOM_MAX, Math.max(camera.zoom - zoomFactor, ZOOM_MIN))

				setCamera({
					zoom: newZoom,
					x: e.clientX - (e.clientX - camera.x) * (newZoom / camera.zoom),
					y: e.clientY - (e.clientY - camera.y) * (newZoom / camera.zoom),
				})
			}}
		>
			<div style={{
				transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
				transformOrigin: "0 0",
			}}
				className="relative"
			>
				{notes.map(note => (
					<NoteObj key={note.id} note={note} />
				))}
				<ArrowLayer />
				<CollabLayer />

			</div>

			<div style={{
				position: "absolute",
				left: 20,
				bottom: 20,
			}}
				className="h-[50px] bg-white border p-3 text-center"
			>
				{`Camera X: ${Math.round(camera.x * 100) / 100}, Y: ${Math.round(camera.y * 100) / 100}, Zoom: ${Math.round(camera.zoom * 100) / 100}`}
			</div>

			<button style={{
				position: "absolute",
				left: 400,
				bottom: 20,
			}}
				className={`border p-3 transition-opacity duration-500 ${camera.x !== 0 || camera.y !== 0 || camera.zoom !== 1 ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				onClick={resetCamera}
				onPointerDown={(e) => e.stopPropagation()}
			>
				Reset View
			</button>

			<div className="absolute top-10 left-1/2 -translate-x-1/2 "
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="text-2xl font-normal">
					{board &&
						<>
							<div>
								{board.name}
							</div>
							<button onClick={() => handleRenameBoard()}>
								Rename
							</button>
						</>
					}
				</div>
			</div>

			<div
				className="toolbar"
			>
				
				<button
				// Mouse button
				// TODO: Add logic for it
				className="icon"
				onPointerDown={(e) => e.stopPropagation()}
				>
				<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
				  <path d="M11.0854 6.83698C9.59373 6.04573 7.8467 7.31745 8.13967 8.97898L12.1326 31.624C12.4664 33.5172 15.0027 33.9266 15.915 32.2338L20.2492 24.1939C20.4091 23.8976 20.6341 23.6413 20.9073 23.4443C21.1804 23.2473 21.4946 23.1147 21.8263 23.0565L30.9488 21.448C32.8499 21.1127 33.2523 18.5599 31.5449 17.6584L11.0854 6.83698Z" fill="black"/>
				</svg>
				</button>
				
				<button
					// XXX: change coords of new note to not be 0, 0 
					onClick={() => {
						const n = createNote(0, 0, board!.id, user!.id)
						saveNote(n)
					}}
					onPointerDown={(e) => e.stopPropagation()}
					className="icon"
				>
				<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
				  <path d="M18.375 27.125H8.75C8.26875 27.125 7.875 26.7313 7.875 26.25V8.75C7.875 8.26875 8.26875 7.875 8.75 7.875H26.25C26.7313 7.875 27.125 8.26875 27.125 8.75V18.375H22.3125C20.1359 18.375 18.375 20.1359 18.375 22.3125V27.125ZM26.0367 21L21 26.0367V22.3125C21 21.5852 21.5852 21 22.3125 21H26.0367ZM5.25 26.25C5.25 28.1805 6.81953 29.75 8.75 29.75H19.5508C20.4805 29.75 21.3719 29.3836 22.0281 28.7273L28.7273 22.0227C29.3836 21.3664 29.75 20.475 29.75 19.5453V8.75C29.75 6.81953 28.1805 5.25 26.25 5.25H8.75C6.81953 5.25 5.25 6.81953 5.25 8.75V26.25Z" fill="black"/>
				</svg>
				</button>
				
				<button
					// XXX: change coords of new note to not be 0, 0 
					onClick={() => setAddMode("ACTIVE")}
					onPointerDown={(e) => e.stopPropagation()}
					className="icon"
				>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="29" viewBox="0 0 32 29" fill="none">
				  <path d="M29 14.5001L19.5208 2.73215C19.3338 2.50003 19.1118 2.3159 18.8675 2.19028C18.6232 2.06466 18.3614 2 18.097 2C17.8326 2 17.5707 2.06466 17.3264 2.19028C17.0821 2.3159 16.8602 2.50003 16.6732 2.73215C16.4862 2.96427 16.3379 3.23984 16.2367 3.54312C16.1355 3.84639 16.0834 4.17145 16.0834 4.49971C16.0834 4.82798 16.1355 5.15303 16.2367 5.45631C16.3379 5.75959 16.4862 6.03516 16.6732 6.26728L21.291 12H6.01385C5.47975 12 4.96751 12.2634 4.58984 12.7322C4.21217 13.2011 4 13.837 4 14.5001C4 15.1631 4.21217 15.7991 4.58984 16.2679C4.96751 16.7368 5.47975 17.0002 6.01385 17.0002H21.291L16.6732 22.7329C16.4855 22.9645 16.3366 23.2399 16.235 23.5433C16.1334 23.8466 16.081 24.1719 16.081 24.5004C16.081 24.829 16.1334 25.1543 16.235 25.4576C16.3366 25.761 16.4855 26.0364 16.6732 26.268C17.0508 26.7367 17.563 27 18.097 27C18.631 27 19.1431 26.7367 19.5208 26.268L29 14.5001Z" fill="black"/>
				</svg>
				</button>

				<button
				// Section button
				// TODO: Add logic for it
				className="icon"
				onPointerDown={(e) => e.stopPropagation()}
				>
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
				  <g clip-path="url(#clip0_74_275)">
				    <path fillRule="evenodd" clip-rule="evenodd" d="M6.25 3.75C5.58696 3.75 4.95107 4.01339 4.48223 4.48223C4.01339 4.95107 3.75 5.58696 3.75 6.25V23.75C3.75 24.413 4.01339 25.0489 4.48223 25.5178C4.95107 25.9866 5.58696 26.25 6.25 26.25H23.75C24.413 26.25 25.0489 25.9866 25.5178 25.5178C25.9866 25.0489 26.25 24.413 26.25 23.75V6.25C26.25 5.58696 25.9866 4.95107 25.5178 4.48223C25.0489 4.01339 24.413 3.75 23.75 3.75H6.25ZM13.75 6.25H6.25V12.5H13.75V6.25ZM6.25 15H13.75C14.413 15 15.0489 14.7366 15.5178 14.2678C15.9866 13.7989 16.25 13.163 16.25 12.5V6.25H23.75V23.75H6.25V15Z" fill="black"/>
				  </g>
				  <defs>
				    <clipPath id="clip0_74_275">
				      <rect width="30" height="30" fill="white"/>
				    </clipPath>
				  </defs>
				</svg>
				</button>
			</div>

			<div
				className="navbar"
				onPointerDown={(e) => e.stopPropagation()}
				>
				<div className="nav-pill">
					<span className="nav-logo">Jot</span>
					<span className="text-xxl">•</span>
					<span className="text-xl cursor-pointer"
					onDoubleClick={handleRenameBoard}
					>
					{board?.name || "Jot Design Brainstorm"}
					</span>
				</div>

				<div className="nav-center">
					<button className="text-xl button white-button shadow-[0_10px_20px_rgba(0,0,0,0.50)]">
					Board
					</button>
					<button className="text-xl button white-button shadow-[0_10px_20px_rgba(0,0,0,0.50)]">
					Table
					</button>
				</div>

				<button className="text-xl button blue-button">
					Share
				</button>
			</div>

			<button
					onPointerDown={(e) => e.stopPropagation()}
					className="absolute right-6 bottom-6 w-[80px] h-[80px] rounded-full bg-[var(--white)] shadow-[0_10px_20px_rgba(0,0,0,0.30)] flex items-center justify-center cursor-pointer hover:bg-[var(--grey)]"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="32"
						viewBox="0 0 57 47"
						fill="none"
					>
						<path
						d="M5.16667 23.25C2.325 23.25 0 20.925 0 18.0833V5.16667C0 2.325 2.325 0 5.16667 0H25.8333C28.675 0 31 2.325 31 5.16667V18.0833C31 20.925 28.675 23.25 25.8333 23.25H20.6667V31L12.9167 23.25H5.16667ZM51.6667 38.75C54.5083 38.75 56.8333 36.425 56.8333 33.5833V20.6667C56.8333 17.825 54.5083 15.5 51.6667 15.5H36.1667V18.0833C36.1667 23.7667 31.5167 28.4167 25.8333 28.4167V33.5833C25.8333 36.425 28.1583 38.75 31 38.75H36.1667V46.5L43.9167 38.75H51.6667Z"
						fill="black"
						/>
					</svg>
				</button>
		</div >
	)
}

export default Canvas
