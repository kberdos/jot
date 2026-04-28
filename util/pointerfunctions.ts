import { Camera, Coordinate } from "./objects/camera"

// general-purpose pointerdown that captures the pointer as you click
export const handlePointerDown = (e: React.PointerEvent) => {
  e.currentTarget.setPointerCapture(e.pointerId)
}

export const handlePointerUp = (e: React.PointerEvent) => {
  e.currentTarget.releasePointerCapture(e.pointerId)
}

export function toCamera(e: MouseEvent | React.PointerEvent, camera: Camera): Coordinate {
  const coords: Coordinate = {
    x: (e.clientX - camera.x) / camera.zoom,
    y: (e.clientY - camera.y) / camera.zoom,
  }
  return coords
}
