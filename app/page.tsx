"use client";

import { login, logout, useAuthStore } from "@/util/auth/auth";
import { useBoardStore } from "@/util/objects/board";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuthStore();
  const { createBoard } = useBoardStore();
  const router = useRouter();

  const viewBoards = () => router.push("/boards");

  const handleNewBoard = async () => {
    const name = "New Board";
    const board = await createBoard(name, user!);
    // user HAS to be specified at this point
    console.log("board id: ", board.id);
    // await saveNotes(board.id, user!)
    router.push(`/boards/${board.id}`);
  };

  return (
    <div className="centered-container">
      {user ? (
        <div className="column-center" style={{ textAlign: "center" }}>
          <p className="text-grey text-large">Welcome, {user.email}</p>

          <div className="column-center" style={{ marginTop: "1.5rem" }}>
            <button className="button grey-button" onClick={viewBoards}>Your Boards</button>

            <button className="button blue-button" onClick={handleNewBoard}>New Board</button>

            <button
              onClick={logout}
              className="text-small text-grey"
              style={{ marginTop: "1rem", cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="column-center" style={{ textAlign: "center" }}>
         
          <h1>
            Jot
          </h1>
          
          <p className="text-xl" style={{ fontStyle: "italic" }}>
            ~ you ought to jot it down ~
          </p>

          <button onClick={login} className="button blue-button">
            Sign in with Google
          </button>
          
        </div>
      )}
    </div>
  );
}
