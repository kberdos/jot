import { create } from "zustand"

export interface Camera {
	x: number;
	y: number;
	zoom: number;
}


interface CameraStore {
	camera: Camera;
	setCamera: (changes: Partial<Camera>) => void;
	resetCamera: () => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
	camera: { x: 0, y: 0, zoom: 1 },
	setCamera: (changes) => set(state => ({
		camera: { ...state.camera, ...changes }
	})),
	resetCamera: () => set(_ => ({
		// TODO: smooth gradient back to these positions
		camera: { x: 0, y: 0, zoom: 1 }
	})),
}))
