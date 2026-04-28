/**
 * Main overlay that sits on top of the canvas 
 */

import { login, logout, useAuthStore } from "@/util/auth/auth"
import Canvas from "./Canvas"
import { useRouter } from "next/navigation"
import JotChat from "./JotChat"


export default function Home() {
	const { user } = useAuthStore()
	const router = useRouter()
	const viewBoards = () => {
		router.push("/boards")
	}
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
			<Canvas />
			{/* <div className="flex-grow w-[540px]">
				<JotChat />
			</div > */}
		</div >
	)
}
