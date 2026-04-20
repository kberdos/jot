"use client"
import { login, logout, useAuthStore } from "@/util/auth/auth";
import { useBoardStore } from "@/util/objects/board";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuthStore()
  const { createBoard } = useBoardStore()
  const router = useRouter()
  const viewBoards = () => {
    router.push("/boards")
  }

  const handleNewBoard = async () => {
    const name = "New Board"
    const board = await createBoard(name, user!)
    // user HAS to be specified at this point
    console.log("board id: ", board.id)
    // await saveNotes(board.id, user!)
    router.push(`/boards/${board.id}`)
  }
  return (
    <>
      {user ?
        (
          <div>
            <div className="text-center">
              Welcome, {user.email}
            </div>
            <div className="flex flex-col">
              <button onClick={logout}>
                Sign Out
              </button>
              <button onClick={viewBoards}>
                Your Boards
              </button>
              <button onClick={handleNewBoard}>
                New Board
              </button>
            </div>
          </div>
        )
        :
        <div>
          <div className="text-xl text-bold m-3 text-center">
            Jot
          </div>
          <button onClick={login}>
            Sign in with Google
          </button>
        </div>
      }
    </>
  );
}
