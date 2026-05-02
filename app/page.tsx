"use client";

import { login, logout, useAuthStore } from "@/util/auth/auth";
import { normalizeBoard, useBoardStore } from "@/util/objects/board";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Board } from "@/util/objects/board";
import { supabase } from "@/util/supabase/supabase";
import { User } from "@supabase/supabase-js";
import BoardPreview, { BoardPreviewData } from "@/components/BoardPreview";
import { Note } from "@/util/objects/note";
import { Section } from "@/util/objects/section";
import { Arrow } from "@/util/objects/arrow";

type BoardPreviewMap = Record<string, BoardPreviewData>;

async function getBoards(user: User): Promise<Board[]> {
	const { data, error } = await supabase
		.from("boards")
		.select("*")
		.eq("author", user.id)
		.order("name", { ascending: true });
	if (error) throw error;
	return (data as Board[]).map(normalizeBoard);
}

async function getSharedBoards(): Promise<Board[]> {
	const { data: sessionData } = await supabase.auth.getSession();
	const token = sessionData.session?.access_token;

	if (!token) return [];

	const response = await fetch("/api/shared-boards", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error ?? "Failed to load shared boards");
	}

	return (data.boards as Board[]).map(normalizeBoard);
}

async function getBoardPreviews(boardIds: string[]): Promise<BoardPreviewMap> {
	if (boardIds.length === 0) return {};

	const [notesResult, sectionsResult, arrowsResult] = await Promise.all([
		supabase.from("notes").select("*").in("board_id", boardIds),
		supabase.from("sections").select("*").in("board_id", boardIds),
		supabase.from("arrows").select("*").in("board_id", boardIds),
	]);

	if (notesResult.error) throw notesResult.error;
	if (sectionsResult.error) throw sectionsResult.error;
	if (arrowsResult.error) throw arrowsResult.error;

	const previews = Object.fromEntries(
		boardIds.map((boardId) => [
			boardId,
			{ notes: [], sections: [], arrows: [] } satisfies BoardPreviewData,
		]),
	) as BoardPreviewMap;

	(notesResult.data as Note[]).forEach((note) => {
		previews[note.board_id]?.notes.push({
			...note,
			text: note.text ?? "",
			type: note.type === "question" ? "question" : "idea",
		});
	});
	(sectionsResult.data as Section[]).forEach((section) => {
		previews[section.board_id]?.sections.push(section);
	});
	(arrowsResult.data as Arrow[]).forEach((arrow) => {
		previews[arrow.board_id]?.arrows.push(arrow);
	});

	return previews;
}

export default function Home() {
	const { user } = useAuthStore();
	const [boards, setBoards] = useState<Board[]>([]);
	const [boardPreviews, setBoardPreviews] = useState<BoardPreviewMap>({});
	const { createBoard } = useBoardStore();
	const router = useRouter();
	const [showSignOut, setShowSignOut] = useState(false);
	const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
	const [isLoadingBoards, setIsLoadingBoards] = useState(false);
	const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
	const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);


	useEffect(() => {
		if (!user) return;
		let cancelled = false;

		const load = async () => {
			setIsLoadingBoards(true);
			setBoards([]);
			setBoardPreviews({});

			try {
				const b = activeTab === "my"
					? await getBoards(user)
					: await getSharedBoards();
				if (cancelled) return;

				setBoards(b);

				try {
					const previews = await getBoardPreviews(b.map((board) => board.id));
					if (!cancelled) setBoardPreviews(previews);
				} catch (error) {
					console.error("Failed to load board previews:", error);
					if (!cancelled) setBoardPreviews({});
				}

			} catch (error) {
				console.error("Failed to load boards:", error);
				if (!cancelled) {
					setBoards([]);
					setBoardPreviews({});
				}
			} finally {
				if (!cancelled) setIsLoadingBoards(false);
			}
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [user, activeTab]);

	const changeTab = (tab: "my" | "shared") => {
		if (tab === activeTab) return;
		setActiveTab(tab);
		setSelectedBoardId(null);
		setBoards([]);
		setBoardPreviews({});
		setIsLoadingBoards(true);
	};

	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			const target = e.target;

			if (!(target instanceof HTMLElement)) return;
			if (target.closest(".board-card")) return;

			setSelectedBoardId(null);
		};

		window.addEventListener("pointerdown", handlePointerDown);

		return () => window.removeEventListener("pointerdown", handlePointerDown);
	}, []);



	const deleteSelectedBoard = useCallback(async () => {
		if (!selectedBoardId || !user || deletingBoardId) return;
		setDeletingBoardId(selectedBoardId);
		const childTables = ["arrows", "notes", "sections"];
		for (const table of childTables) {
			const { error } = await supabase
				.from(table)
				.delete()
				.eq("board_id", selectedBoardId);
			if (error) {
				setDeletingBoardId(null);
				throw error;
			}
		}
		const { error } = await supabase
			.from("boards")
			.delete()
			.eq("id", selectedBoardId)
			.eq("author", user.id);

		if (error) {
			setDeletingBoardId(null);
			throw error;
		}

		setBoards((currentBoards) =>
			currentBoards.filter((board) => board.id !== selectedBoardId),
		);

		setSelectedBoardId(null);
		setDeletingBoardId(null);
	}, [deletingBoardId, selectedBoardId, user]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Delete" && e.key !== "Backspace") return;

			const target = e.target;
			const isEditingText =
				target instanceof HTMLElement &&
				(target.closest("input, textarea") || target.isContentEditable);

			if (isEditingText || !selectedBoardId) return;

			e.preventDefault();
			deleteSelectedBoard().catch((error) => {
				console.error("Failed to delete board:", error);
			});
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [deleteSelectedBoard, selectedBoardId]);


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
									<div className="profile-top">
										<p className="text-large">{user.email}</p>
										<button onClick={() => setShowSignOut(false)}>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="10"
												height="10"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M1.78922 0.294524L6 4.50513L10.189 0.316341C10.2815 0.217858 10.393 0.139075 10.5167 0.0847163C10.6404 0.0303576 10.7738 0.00154281 10.9089 0C11.1983 0 11.4757 0.114926 11.6803 0.319497C11.8849 0.524067 11.9998 0.801524 11.9998 1.09083C12.0024 1.22457 11.9776 1.35742 11.9269 1.48122C11.8763 1.60502 11.8008 1.71717 11.7053 1.81078L7.46177 5.99957L11.7053 10.2429C11.8851 10.4188 11.9905 10.657 11.9998 10.9083C11.9998 11.1976 11.8849 11.4751 11.6803 11.6796C11.4757 11.8842 11.1983 11.9991 10.9089 11.9991C10.7699 12.0049 10.6312 11.9817 10.5016 11.931C10.3721 11.8803 10.2544 11.8032 10.1562 11.7046L6 7.49401L1.80012 11.6937C1.70795 11.7889 1.59784 11.8649 1.47614 11.9173C1.35444 11.9698 1.22356 11.9976 1.09105 11.9991C0.801736 11.9991 0.524267 11.8842 0.319688 11.6796C0.115109 11.4751 0.000177493 11.1976 0.000177493 10.9083C-0.00236588 10.7746 0.0224482 10.6417 0.0730971 10.5179C0.123746 10.3941 0.199161 10.282 0.294714 10.1884L4.53822 5.99957L0.294714 1.75624C0.114921 1.58035 0.00949316 1.34217 0.000177493 1.09083C0.000177493 0.801524 0.115109 0.524067 0.319688 0.319497C0.524267 0.114926 0.801736 0 1.09105 0C1.35286 0.00327249 1.60377 0.109083 1.78922 0.294524Z"
													fill="black"
												/>
											</svg>
										</button>
									</div>
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
									className={`button text-xl ${activeTab === "my" ? "grey-button-active" : "grey-button"
										}`}
									onClick={() => changeTab("my")}
								>
									My boards
								</button>

								<button
									className={`button text-xl ${activeTab === "shared"
										? "grey-button-active"
										: "grey-button"
										}`}
									onClick={() => changeTab("shared")}
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
						
              {boards.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <p className="text-grey text-xl">
                    {activeTab === "my"
                      ? "You have no boards. Wanna fix that?"
                      : "No one’s shared anything with you… awkward."}
                  </p>
                </div>
              ) : (
              <div className="boards-grid">
                {boards.map((b) => (
                  <div key={b.id}>
                    <button
                      className={`board-card ${selectedBoardId === b.id ? "board-card-selected" : ""
                        }`}
                      disabled={deletingBoardId === b.id}
                      aria-pressed={selectedBoardId === b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoardId(b.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        router.push(`/boards/${b.id}`);
                      }}
                    >
                      <div className="board-thumbnail">
                        <BoardPreview data={boardPreviews[b.id]} />
                      </div>
                      <div className="board-info">
                        <p className="text-xl">{b.name}</p>
                        {activeTab === "shared" && b.owner_email && (
                          <p className="text-small text-grey subtext">From {b.owner_name ?? b.owner_email}</p>
                        )}
                        <div className="text-small text-grey">
                          {activeTab === "my" && (
                            <p className="text-small text-grey subtext">
                              {b.last_updated_at
                                ? `Last edited at ${new Date(b.last_updated_at).toLocaleString()}`
                                : "Just created"}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
						  </div>
            )}
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