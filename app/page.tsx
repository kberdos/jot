"use client"
import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"
import { useEffect } from "react"
import { User } from "@supabase/supabase-js"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

const DEFAULT_NOTE_WIDTH = 200
const DEFAULT_NOTE_COLOR = "#FEFF9C"


async function login() {
  await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
}


interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface Note {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number
  color: string;
}

interface NoteStore {
  notes: Note[];
  updateNote: (id: string, changes: Partial<Note>) => void;
  newNote: (x: number, y: number) => void;
}

interface CameraStore {
  camera: Camera;
  setCamera: (changes: Partial<Camera>) => void;
  resetCamera: () => void;
}

interface AuthStore {
  user: User | undefined
  setUser(user: User | undefined): void;
}


const useAuthStore = create<AuthStore>((set) => ({
  user: undefined,
  setUser: (user: User | undefined) => set(state => ({
    user: user,
  })),
}))

const useNoteStore = create<NoteStore>((set) => ({
  notes: [{ id: "0", x: 300, y: 300, width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_WIDTH, color: DEFAULT_NOTE_COLOR }],
  updateNote: (id, changes) => set(state => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...changes } : n)
  })),
  newNote: (x, y) => set(state => ({
    notes: [...state.notes, {
      id: crypto.randomUUID(),
      x: x,
      y: y,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_WIDTH,
      color: DEFAULT_NOTE_COLOR
    }],
  }))
}))

const useCameraStore = create<CameraStore>((set) => ({
  camera: { x: 0, y: 0, zoom: 1 },
  setCamera: (changes) => set(state => ({
    camera: { ...state.camera, ...changes }
  })),
  resetCamera: () => set(_ => ({
    // TODO: smooth gradient back to these positions
    camera: { x: 0, y: 0, zoom: 1 }
  })),
}))

const handlePointerDown = (e: React.PointerEvent) => {
  e.currentTarget.setPointerCapture(e.pointerId)
}
const handlePointerUp = (e: React.PointerEvent) => {
  e.currentTarget.releasePointerCapture(e.pointerId)
}


const NoteObj = ({ note }: { note: Note }) => {
  const updateNote = useNoteStore(state => state.updateNote)
  const camera = useCameraStore(state => state.camera)

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (e.buttons !== 1) return;
    updateNote(note.id, {
      x: note.x + e.movementX / camera.zoom,
      y: note.y + e.movementY / camera.zoom,
    })
  }

  return (
    <div style={{
      position: "absolute",
      left: note.x,
      top: note.y,
    }}
      onPointerDown={(e) => {
        e.stopPropagation()
        handlePointerDown(e)
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={{
        backgroundColor: note.color,
        width: `${note.width}px`,
        height: `${note.height}px`,
      }}
      />
    </div>
  )
}

const Canvas = () => {
  const { camera, setCamera, resetCamera } = useCameraStore()
  const { notes, newNote } = useNoteStore()
  const { user } = useAuthStore()

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    console.log("moving")
    console.log(e.movementX, e.movementY)
    setCamera({
      x: camera.x + e.movementX / camera.zoom,
      y: camera.y + e.movementY / camera.zoom,
    })
  }

  return (
    <div className="w-screen h-screen overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
        backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
        backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={(e) => {
        const zoomFactor = e.deltaY * 0.001
        const newZoom = Math.min(ZOOM_MAX, Math.max(camera.zoom - zoomFactor, ZOOM_MIN))

        setCamera({
          zoom: newZoom,
          x: e.clientX - (e.clientX - camera.x) * (newZoom / camera.zoom),
          y: e.clientY - (e.clientY - camera.y) * (newZoom / camera.zoom),
        })
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
      <div style={{
        position: "absolute",
        right: 20,
        top: 20,
      }}
        className="h-[50px] bg-white border p-3 text-center"
      >
        {`Camera X: ${Math.round(camera.x * 100) / 100}, Y: ${Math.round(camera.y * 100) / 100}, Zoom: ${Math.round(camera.zoom * 100) / 100}`}
      </div>
      <div style={{
        position: "absolute",
        right: 20,
        top: 80,
      }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {user ?
          <div>
            {`Hello, ${user.email}`}
          </div>
          :
          <button onClick={login}>
            Sign In
          </button>
        }
      </div>

      <button style={{
        position: "absolute",
        right: 20,
        bottom: 20,
      }}
        className={`border p-3 transition-opacity duration-500 ${camera.x !== 0 || camera.y !== 0 || camera.zoom !== 1 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={resetCamera}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Reset View
      </button>

      <div style={{
        position: "absolute",
        left: 20,
        top: 20,
      }}
      >
        <button
          // XXX: where should new coords be?
          onClick={() => newNote(0, 0)}
          onPointerDown={(e) => e.stopPropagation()}
          className="border p-3"
        >
          New Note
        </button>
      </div>
    </div >
  )
}

export default function Home() {
  const { user, setUser } = useAuthStore()
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? undefined)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])
  return (
    <div>
      <Canvas />
    </div>
  );
}
