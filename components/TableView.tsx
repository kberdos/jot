"use client"

import { useCameraStore } from "@/util/objects/camera"


export default function TableView() {
	const { camera } = useCameraStore()
	return (
		<div
			className="w-full h-full pt-40 px-16"
			style={{
				backgroundColor: "var(--light-grey)",
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)
					}px`,
			}}
		>
			<p>
				Hello World
			</p>
		</div>
	)
}
