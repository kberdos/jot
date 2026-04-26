"use client"

import { useCollabStore } from "@/util/objects/collab"

export default function CollabLayer() {
	const { cursors } = useCollabStore()

	return (
		<>
			{cursors.map((cursor) => {
				return (
					<div style={{
						position: "absolute",
						left: cursor.x,
						top: cursor.y,
					}}
						key={cursor.user_id}
					// onPointerDown={(e) => {
					// 	e.stopPropagation()
					// 	handlePointerDown(e)
					// }}
					// onPointerMove={handlePointerMove}
					// onPointerUp={handlePointerUp}
					>
						<div style={{
							backgroundColor: "#00FF00",
							width: `20px`,
							height: `20px`,
						}}
						>
							{cursor.user_email}
						</div>
					</div>
				)
			})}
		</>
	)
}
