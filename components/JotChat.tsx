"use client";
import { useRef, useState } from "react";
import { useBoardStore } from "@/util/objects/board";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export default function JotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { board, setIsChatOpen } = useBoardStore();

  const [width, setWidth] = useState(540);
  const resizeStartRef = useRef({ x: 0, width: 540 });

  // useEffect(() => {
  // 	setIsChatOpen(true)
  // 	return () => setIsChatOpen(false)
  // }, [])

  const finishResize = () => {
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  const clampWidth = (value: number) => Math.max(300, Math.min(value, 1200));

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", parts: [{ text: input }] },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        boardId: board!.id, // need a board
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("API error:", text);
      setLoading(false);
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Invalid JSON response:", e);
      setLoading(false);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "model", parts: [{ text: data.text }] },
    ]);
    setLoading(false);
  };

  return (
    // <div className="flex flex-col h-full border-l border-[var(--grey)]"
    // 		style={{ width }}

    // 	>
    <div
      className="fixed top-0 right-0 h-screen bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col border-l border-[var(--grey)] z-50"
      style={{ width }}
    >
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          resizeStartRef.current = { x: e.clientX, width };
          e.currentTarget.setPointerCapture(e.pointerId);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

          e.preventDefault();
          const dx = resizeStartRef.current.x - e.clientX;
          setWidth(clampWidth(resizeStartRef.current.width + dx));
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          finishResize();
        }}
        onPointerCancel={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          finishResize();
        }}
        // className="absolute left-0 top-0 h-full w-3 cursor-col-resize group"
        className="absolute left-0 top-0 h-full w-4 cursor-col-resize z-50 touch-none"
      ></div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="nav-logo text-2xl">JotChat</div>

        <button
          className="text-xxl font-bold"
          onClick={() => setIsChatOpen(false)}
        >
          {/* ✕ */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-sm text-black leading-relaxed space-y-3">
            <p>
              Hi! I am here to assist you in understanding your Jot board. Some
              things that I can do include:
            </p>

            <ul className="list-disc ml-5 space-y-1">
              <li>
                <b>Find & highlight:</b> search for notes containing or related
                to a word/topic
              </li>
              <li>
                <b>Summarize:</b> get a brief summary of notes containing or
                related to a word/topic
              </li>
              <li>
                <b>Organize:</b> duplicate and group notes containing or related
                to a word/topic into a new section
              </li>
              <li>
                <b>Explore connections:</b> select a note and see how it
                connects to others
              </li>
            </ul>

            <p className="text-grey text-xs">
              Tip: Click any note and choose “Use in chat” to focus action on
              that specific note.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${m.role === "user" ? "self-end bg-blue-100" : "self-start bg-gray-100"}`}
          >
            {m.parts[0].text}
          </div>
        ))}
        {loading && <div className="self-start text-gray-400">thinking...</div>}
      </div>
      {/* <div className="flex gap-2 p-3">
				<input
					className="flex-1 border rounded p-2"
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={e => e.key === "Enter" && sendMessage()}
					placeholder="Ask about your board..."
				/>
				<button className="border rounded px-3" onClick={sendMessage}>Send</button>
			</div> */}
      <div className="p-3">
        <div className="flex items-center bg-[var(--light-grey)] rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Write a message..."
          />
          <button
            onClick={sendMessage}
            className="ml-2 w-8 h-8 flex text-xl font-bold items-center justify-center rounded-full bg-white shadow hover:bg-[var(--grey)]"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
