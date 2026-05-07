"use client";

import { RefObject, useCallback, useEffect, useRef } from "react";

import { Camera } from "@/util/objects/camera";

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

type TouchPoint = {
	x: number;
	y: number;
};

type PinchGesture = {
	distance: number;
	midpoint: TouchPoint;
	camera: {
		x: number;
		y: number;
		zoom: number;
	};
};

const getDistance = (a: TouchPoint, b: TouchPoint) =>
	Math.hypot(a.x - b.x, a.y - b.y);

const getMidpoint = (a: TouchPoint, b: TouchPoint): TouchPoint => ({
	x: (a.x + b.x) / 2,
	y: (a.y + b.y) / 2,
});

const clampZoom = (zoom: number) =>
	Math.min(ZOOM_MAX, Math.max(zoom, ZOOM_MIN));

export function useCanvasGestures(
	canvasRef: RefObject<HTMLDivElement | null>,
	cameraRef: RefObject<Camera>,
	setCamera: (changes: Partial<Camera>) => void,
) {
	const touchPointers = useRef(new Map<number, TouchPoint>())
	const pinchGesture = useRef<PinchGesture | null>(null)
	const gestureStart = useRef<PinchGesture | null>(null)

	const zoomAtPoint = useCallback(
		(
			point: TouchPoint,
			newZoom: number,
			initialCamera = cameraRef.current,
			initialPoint = point,
		) => {
			const zoomRatio = newZoom / initialCamera.zoom

			setCamera({
				zoom: newZoom,
				x: point.x - (initialPoint.x - initialCamera.x) * zoomRatio,
				y: point.y - (initialPoint.y - initialCamera.y) * zoomRatio,
			})
		},
		[cameraRef, setCamera],
	)

	const startPinchGesture = useCallback(() => {
		const [firstTouch, secondTouch] = Array.from(touchPointers.current.values())

		if (!firstTouch || !secondTouch) return

		pinchGesture.current = {
			distance: getDistance(firstTouch, secondTouch),
			midpoint: getMidpoint(firstTouch, secondTouch),
			camera: cameraRef.current,
		}
	}, [cameraRef])

	const startTouchPointer = useCallback((e: React.PointerEvent) => {
		if (e.pointerType !== "touch") return false

		touchPointers.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY,
		})

		if (touchPointers.current.size >= 2) {
			startPinchGesture()
			return true
		}

		return false
	}, [startPinchGesture])

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		if (e.pointerType === "touch") {
			if (!touchPointers.current.has(e.pointerId)) return

			touchPointers.current.set(e.pointerId, {
				x: e.clientX,
				y: e.clientY,
			})

			if (touchPointers.current.size >= 2) {
				const [firstTouch, secondTouch] = Array.from(
					touchPointers.current.values(),
				)

				if (!firstTouch || !secondTouch) return
				if (!pinchGesture.current) startPinchGesture()
				if (!pinchGesture.current || pinchGesture.current.distance === 0) return

				const distance = getDistance(firstTouch, secondTouch)
				const midpoint = getMidpoint(firstTouch, secondTouch)
				const initial = pinchGesture.current
				const newZoom = clampZoom(
					initial.camera.zoom * (distance / initial.distance),
				)

				zoomAtPoint(midpoint, newZoom, initial.camera, initial.midpoint)
				return
			}
		}
	}, [startPinchGesture, zoomAtPoint])

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (e.pointerType === "touch") {
			touchPointers.current.delete(e.pointerId)
			pinchGesture.current = null

			if (touchPointers.current.size >= 2) {
				startPinchGesture()
			}
		}

		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
	}, [startPinchGesture])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault()

			const currentCamera = cameraRef.current

			if (!e.ctrlKey) {
				const deltaScale =
					e.deltaMode === WheelEvent.DOM_DELTA_LINE
						? 16
						: e.deltaMode === WheelEvent.DOM_DELTA_PAGE
							? window.innerHeight
							: 1

				setCamera({
					x: currentCamera.x - e.deltaX * deltaScale,
					y: currentCamera.y - e.deltaY * deltaScale,
				})

				return
			}

			const newZoom = clampZoom(
				currentCamera.zoom * Math.exp(-e.deltaY * 0.01),
			)

			zoomAtPoint({ x: e.clientX, y: e.clientY }, newZoom, currentCamera)
		}

		const getGesturePoint = (e: Event): TouchPoint => {
			const gestureEvent = e as Event & {
				clientX?: number
				clientY?: number
			}

			const rect = canvas.getBoundingClientRect()

			return {
				x: gestureEvent.clientX ?? rect.left + rect.width / 2,
				y: gestureEvent.clientY ?? rect.top + rect.height / 2,
			}
		}

		const handleGestureStart = (e: Event) => {
			e.preventDefault()

			gestureStart.current = {
				distance: 1,
				midpoint: getGesturePoint(e),
				camera: cameraRef.current,
			}
		}

		const handleGestureChange = (e: Event) => {
			e.preventDefault()

			const gestureEvent = e as Event & { scale?: number }
			const initial = gestureStart.current

			if (!initial || !gestureEvent.scale) return

			const midpoint = getGesturePoint(e)
			const newZoom = clampZoom(initial.camera.zoom * gestureEvent.scale)

			zoomAtPoint(midpoint, newZoom, initial.camera, initial.midpoint)
		}

		const handleGestureEnd = (e: Event) => {
			e.preventDefault()
			gestureStart.current = null
		}

		canvas.addEventListener("wheel", handleWheel, { passive: false })
		canvas.addEventListener("gesturestart", handleGestureStart, {
			passive: false,
		})
		canvas.addEventListener("gesturechange", handleGestureChange, {
			passive: false,
		})
		canvas.addEventListener("gestureend", handleGestureEnd, {
			passive: false,
		})

		return () => {
			canvas.removeEventListener("wheel", handleWheel)
			canvas.removeEventListener("gesturestart", handleGestureStart)
			canvas.removeEventListener("gesturechange", handleGestureChange)
			canvas.removeEventListener("gestureend", handleGestureEnd)
		}
	}, [canvasRef, cameraRef, setCamera, zoomAtPoint])

	return {
		handlePointerMove,
		handlePointerUp,
		startTouchPointer,
	}
}
