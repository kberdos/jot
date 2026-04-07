"use client"
import { useState } from "react";


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

const NoteObj = (props: { note: Note }) => {
  return (
    <div style={{
      position: "absolute",
      left: props.note.x,
      top: props.note.y,
      backgroundColor: props.note.color,
    }} className='w-[100px] h-[100px]' />
  )
}

const Canvas = () => {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
  const [notes, setNotes] = useState([{ id: 0, x: 100, y: 100, color: "#ff0000" }])
  return (
    <div className="w-screen h-screen overflow-hidden" >
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
