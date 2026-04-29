"use client";

import { login, logout, useAuthStore } from "@/util/auth/auth";
import { useBoardStore } from "@/util/objects/board";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Board } from "@/util/objects/board";
import { supabase } from "@/util/supabase/supabase";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import thumbnail from "../assets/dummy-thumbnail.png";

async function getBoards(user: User): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("author", user.id)
    .order("name", { ascending: true });
  if (error) throw error;
  return data as Board[];
}

export default function Home() {
  const { user } = useAuthStore();
  const [boards, setBoards] = useState<Board[]>([]);
  const { createBoard } = useBoardStore();
  const router = useRouter();
  const [showSignOut, setShowSignOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");

  const viewBoards = () => router.push("/boards");

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const b = await getBoards(user);
      setBoards(b);
    };

    load();
  }, [user]);

  const handleNewBoard = async () => {
    const name = "New Board";
    const board = await createBoard(name, user!);
    // user HAS to be specified at this point
    console.log("board id: ", board.id);
    // await saveNotes(board.id, user!)
    router.push(`/boards/${board.id}`);
  };

  return (
    <div>
      {user ? (
        <div>
          <header className="top-bar">
            <button>
              <h2>Jot</h2>
            </button>
            <div className="profile-area">
              <button className="icon" onClick={() => setShowSignOut(true)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 25 25"
                  fill="none"
                >
                  <path
                    d="M8.08594 10.6641C6.86198 9.4401 6.25 7.96875 6.25 6.25C6.25 4.53125 6.86198 3.0599 8.08594 1.83594C9.30989 0.611979 10.7812 0 12.5 0C14.2187 0 15.6901 0.611979 16.9141 1.83594C18.138 3.0599 18.75 4.53125 18.75 6.25C18.75 7.96875 18.138 9.4401 16.9141 10.6641C15.6901 11.888 14.2187 12.5 12.5 12.5C10.7812 12.5 9.30989 11.888 8.08594 10.6641ZM0 25V20.625C0 19.7396 0.228125 18.926 0.684375 18.1844C1.14063 17.4427 1.74583 16.876 2.5 16.4844C4.11458 15.6771 5.75521 15.0719 7.42187 14.6687C9.08854 14.2656 10.7812 14.0635 12.5 14.0625C14.2187 14.0615 15.9115 14.2635 17.5781 14.6687C19.2448 15.074 20.8854 15.6792 22.5 16.4844C23.2552 16.875 23.8609 17.4417 24.3172 18.1844C24.7734 18.9271 25.001 19.7406 25 20.625V25H0Z"
                    fill="black"
                  />
                </svg>
              </button>
              {showSignOut && (
                <div className="profile-popup">
                  <button onClick={() => setShowSignOut(false)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M1.78922 0.294524L6 4.50513L10.189 0.316341C10.2815 0.217858 10.393 0.139075 10.5167 0.0847163C10.6404 0.0303576 10.7738 0.00154281 10.9089 0C11.1983 0 11.4757 0.114926 11.6803 0.319497C11.8849 0.524067 11.9998 0.801524 11.9998 1.09083C12.0024 1.22457 11.9776 1.35742 11.9269 1.48122C11.8763 1.60502 11.8008 1.71717 11.7053 1.81078L7.46177 5.99957L11.7053 10.2429C11.8851 10.4188 11.9905 10.657 11.9998 10.9083C11.9998 11.1976 11.8849 11.4751 11.6803 11.6796C11.4757 11.8842 11.1983 11.9991 10.9089 11.9991C10.7699 12.0049 10.6312 11.9817 10.5016 11.931C10.3721 11.8803 10.2544 11.8032 10.1562 11.7046L6 7.49401L1.80012 11.6937C1.70795 11.7889 1.59784 11.8649 1.47614 11.9173C1.35444 11.9698 1.22356 11.9976 1.09105 11.9991C0.801736 11.9991 0.524267 11.8842 0.319688 11.6796C0.115109 11.4751 0.000177493 11.1976 0.000177493 10.9083C-0.00236588 10.7746 0.0224482 10.6417 0.0730971 10.5179C0.123746 10.3941 0.199161 10.282 0.294714 10.1884L4.53822 5.99957L0.294714 1.75624C0.114921 1.58035 0.00949316 1.34217 0.000177493 1.09083C0.000177493 0.801524 0.115109 0.524067 0.319688 0.319497C0.524267 0.114926 0.801736 0 1.09105 0C1.35286 0.00327249 1.60377 0.109083 1.78922 0.294524Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                  <p>{user.email}</p>
                  <button
                    className="button grey-button button-small"
                    onClick={logout}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </header>

          <main>
            <div className="dashboard-actions">
              <div className="left-buttons">
                <button
                  className={`button text-xl ${
                    activeTab === "my" ? "grey-button-active" : "grey-button"
                  }`}
                  onClick={() => setActiveTab("my")}
                >
                  My boards
                </button>

                <button
                  className={`button text-xl ${
                    activeTab === "shared"
                      ? "grey-button-active"
                      : "grey-button"
                  }`}
                  onClick={() => setActiveTab("shared")}
                >
                  Shared with me
                </button>
              </div>
              <button
                className="button blue-button text-xl"
                onClick={handleNewBoard}
              >
                Create new board
              </button>
            </div>
            <div className="boards-grid">
              {boards.map((b) => (
                <div key={b.id} className="board-card">
                  <button
                    key={b.id}
                    className="board-card"
                    onClick={() => router.push(`/boards/${b.id}`)}
                  >
                    <div className="board-thumbnail">
                      <Image
                        src={thumbnail}
                        alt={`${b.name} thumbnail`}
                        className="board-thumbnail-img"
                      />
                    </div>
                    <div className="board-info">
                      <p className="text-xl">{b.name}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </main>
        </div>
      ) : (
        <div
          className="column-center centered-container"
          style={{ textAlign: "center" }}
        >
          <h1>Jot</h1>
          <p className="text-xxl" style={{ fontStyle: "italic" }}>
            ~ you ought to jot it down ~
          </p>

          <button onClick={login} className="button blue-button text-xl">
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
