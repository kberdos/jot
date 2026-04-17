/**
 * Main overlay that sits on top of the canvas 
 */

import { login, logout, useAuthStore } from "@/util/auth/auth"
import Canvas from "./Canvas"


export default function Home() {
	const { user } = useAuthStore()
	return (
		<div className="w-screen h-screen">
			<div style={{
				position: "absolute",
				right: 20,
				top: 20,
			}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				{user ?
					<>
						<div>
							{`Hello, ${user.email}`}
						</div>
						<button onClick={logout}>
							Sign Out
						</button>
					</>
					:
					<button onClick={login}>
						Sign In
					</button>
				}
			</div>
			<Canvas />
		</div >
	)
}
