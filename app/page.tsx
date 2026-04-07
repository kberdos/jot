"use client"
import { create } from "zustand"


interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface Note {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface NoteStore {
  notes: Note[];
  updateNote: (id: number, changes: Partial<Note>) => void;
}

interface CameraStore {
  camera: Camera;
  setCamera: (changes: Partial<Camera>) => void;
}

const useNoteStore = create<NoteStore>((set) => ({
  notes: [{ id: 0, x: 100, y: 100, color: "#ff0000" }],
  updateNote: (id, changes) => set(state => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...changes } : n)
  }))
}))

const useCameraStore = create<CameraStore>((set) => ({
  camera: { x: 0, y: 0, zoom: 1 },
  setCamera: (changes) => set(state => ({
    camera: { ...state.camera, ...changes }
  }))
}))


const NoteObj = ({ note }: { note: Note }) => {
  const updateNote = useNoteStore(state => state.updateNote)
  const camera = useCameraStore(state => state.camera)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    console.log("moving")
    console.log(e.movementX, e.movementY)
    updateNote(note.id, {
      x: note.x + e.movementX / camera.zoom,
      y: note.y + e.movementY / camera.zoom,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div style={{
      position: "absolute",
      left: note.x,
      top: note.y,
    }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex align-top gap-2">
        <div style={{
          backgroundColor: note.color,
        }}
          className='w-[100px] h-[100px]' />
        <p className="text-xs text-gray-400">{`(${note.x}, ${note.y})`}</p>
      </div>
    </div>
  )
}

const Canvas = () => {
  const { camera, setCamera } = useCameraStore()
  const notes = useNoteStore(state => state.notes)
  return (
    <div className="w-screen h-screen overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div style={{
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
        transformOrigin: "0 0",
      }}
        className="relative"
      >
        {notes.map(note => (
          <NoteObj key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <Canvas />
    </div>
  );
}
