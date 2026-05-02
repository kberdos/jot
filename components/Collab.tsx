"use client"

import { useCollabStore } from "@/util/objects/collab"

const cursorColors = [
  "var(--purple)",
  "var(--red)",
  "var(--orange)",
  "var(--green)",
]

const colorMap = new Map<string, string>()

function getCursorColor(userId: string) {
  if (!colorMap.has(userId)) {
    const color = cursorColors[colorMap.size % cursorColors.length]
    colorMap.set(userId, color)
  }
  return colorMap.get(userId)!
}


export default function CollabLayer() {
	const { cursors } = useCollabStore()

	return (
		<>
			{cursors.map((cursor) => {
				const color = getCursorColor(cursor.user_id)

				return (
					<div style={{
						position: "absolute",
						left: cursor.x,
						top: cursor.y,
					}}
						key={cursor.user_id}
					>
						<div style={{
							backgroundColor: color,
							width: `20px`,
							height: `20px`,
						}}
						>
							{cursor.user_name}
						</div>
					</div>
				)
			})}
		</>
	)
}
