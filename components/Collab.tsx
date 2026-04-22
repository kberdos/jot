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
					>
						<div style={{
							backgroundColor: cursor.color,
							width: `20px`,
							height: `20px`,
						}}
						>
						</div>
					</div>
				)
			})}
		</>
	)
}
