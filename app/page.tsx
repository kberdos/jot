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
    <div className="min-h-screen flex items-center justify-center bg-white">
      {user ? (
        <div className="text-center space-y-6">
          <p className="text-gray-600">Welcome, {user.email}</p>

          <div className="flex flex-col gap-4 items-center">
            <button onClick={viewBoards}>Your Boards</button>

            <button onClick={handleNewBoard}>New Board</button>

            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:underline mt-4"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-8">
          {/* Title */}
          <h1
            className="text-7xl italic"
            style={{ fontFamily: "EB Garamond, serif" }}
          >
            Jot
          </h1>

          {/* Tagline */}
          <p
            className="text-black italic text-xl"
            style={{ fontFamily: "EB Garamond, serif" }}
          >
            ~ you ought to jot it down ~
          </p>

          {/* Button */}
          <button onClick={login} className="blue-button">
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
