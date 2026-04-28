import { Coordinate } from "./objects/camera"
import { Note, NoteSide } from "./objects/note"

export function getNodeOffsets(note: Note, side: NoteSide): Coordinate {
  switch (side) {
    case "TOP":
      return {
        x: note.width / 2,
        y: 0,
      }
    case "RIGHT":
      return {
        x: note.width,
        y: note.height / 2,
      }
    case "BOTTOM":
      return {
        x: note.width / 2,
        y: note.height,
      }
    case "LEFT":
      return {
        x: 0,
        y: note.height / 2,
      }
  }
}

export function getNoteCoords(note: Note, side: NoteSide): Coordinate {
  switch (side) {
    case "TOP":
      return {
        x: note.x + note.width / 2,
        y: note.y,
      }
    case "RIGHT":
      return {
        x: note.x + note.width,
        y: note.y + note.height / 2,
      }
    case "BOTTOM":
      return {
        x: note.x + note.width / 2,
        y: note.y + note.height,
      }
    case "LEFT":
      return {
        x: note.x,
        y: note.y + note.height / 2,
      }
  }
}
