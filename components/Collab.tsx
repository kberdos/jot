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
						zIndex: 800,
					}}
						key={cursor.user_id}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="19"
							height="20"
							viewBox="0 0 19 20"
							fill="none"
							style={{
							position: "absolute",
							left: 0,
							top: 0,
							}}
						>
							<path
							d="M2.20294 0.178274C1.09955 -0.407015 -0.192737 0.533679 0.0239761 1.76272L2.97756 18.5133C3.22449 19.9137 5.10057 20.2165 5.77538 18.9643L8.98139 13.0173C9.09972 12.7981 9.26615 12.6085 9.4682 12.4628C9.67024 12.3171 9.90266 12.219 10.148 12.1759L16.8959 10.9861C18.3022 10.7381 18.5998 8.84972 17.3369 8.18291L2.20294 0.178274Z"
							fill="black"
							/>
						</svg>
						<div style={{
							position: "absolute",
							backgroundColor: color,
							left: 12,
      						top: 16,
							display: "inline-block",
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
