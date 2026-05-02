/**
 * Main overlay that sits on top of the canvas 
 */

import { login, useAuthStore } from "@/util/auth/auth"
import Canvas from "./Canvas"
import JotChat from "./JotChat"
import { useBoardStore } from "@/util/objects/board"
import BoardNavbar from "./BoardNavbar"
import TableView from "./TableView"


export default function Home() {
	const { user } = useAuthStore()
	const { isChatOpen, setIsChatOpen, viewMode } = useBoardStore()
	return (
		<div className="w-screen h-screen flex flex-row">
			<div style={{
				position: "absolute",
				left: 20,
				top: 20,
			}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				{user ?
					<>
						{/* <div>
							{`Hello, ${user.email}`}
						</div> */}
						<div className="flex flex-col">
							{/* <button onClick={logout}>
								Sign Out
							</button> */}

							{/* <button onClick={viewBoards}>
								Your Boards
							</button> */}
						</div>
					</>
					:
					<button onClick={login}>
						Sign In
					</button>
				}
			</div>
			{viewMode === "BOARD" ? <Canvas /> : <TableView />}
			<BoardNavbar />
			{!isChatOpen && (
				<button
					onPointerDown={(e) => e.stopPropagation()}
					onClick={() => setIsChatOpen(true)}
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
			)}
			{/* {isChatOpen && (
				<div className="flex-grow w-[540px]">
					<JotChat />
				</div>
			)} */}
			{isChatOpen && <JotChat />}
		</div>
	)
}
