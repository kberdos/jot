"use client";
import { useRef, useState } from "react";
import { useBoardStore } from "@/util/objects/board";
import { useChatContextStore } from "@/util/objects/chat";
import { NoteType, useNoteStore } from "@/util/objects/note";
import { useSectionStore } from "@/util/objects/section";
import { supabase } from "@/util/supabase/supabase";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
  contextNotes?: {
    id: string;
    text: string;
    author_name: string;
    color: string;
    type: NoteType;
  }[];
}

const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-[4px] bg-white px-1 py-[1px] font-mono text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
};

const renderHeader = (level: number, content: string, key: number) => {
  const children = renderInlineMarkdown(content);

  if (level === 1) {
    return <h1 key={key} className="text-xl font-semibold">{children}</h1>;
  }

  if (level === 2) {
    return <h2 key={key} className="text-large font-semibold">{children}</h2>;
  }

  if (level === 3) {
    return <h3 key={key} className="text-sm font-semibold">{children}</h3>;
  }

  if (level === 4) {
    return <h4 key={key} className="text-sm font-semibold">{children}</h4>;
  }

  if (level === 5) {
    return <h5 key={key} className="text-sm font-semibold">{children}</h5>;
  }

  return <h6 key={key} className="text-sm font-semibold">{children}</h6>;
};

const ChatText = ({ text }: { text: string }) => {
  const lines = text.split(/\n/);
  const blocks: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    const codeFenceMatch = line.match(/^```.*$/);
    if (codeFenceMatch) {
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <pre
          key={blocks.length}
          className="overflow-x-auto rounded-[6px] bg-white p-3 font-mono text-[11px] leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];

      blocks.push(renderHeader(level, content, blocks.length));
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      const isNumbered = Boolean(numberedMatch);
      const items: string[] = [];

      while (i < lines.length) {
        const currentLine = lines[i];
        const match = isNumbered
          ? currentLine.match(/^\d+\.\s+(.+)$/)
          : currentLine.match(/^[-*]\s+(.+)$/);

        if (!match) break;
        items.push(match[1]);
        i++;
      }

      i--;

      const ListTag = isNumbered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={blocks.length}
          className={`${isNumbered ? "list-decimal" : "list-disc"} ml-5 space-y-1`}
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    blocks.push(<p key={blocks.length}>{renderInlineMarkdown(line)}</p>);
  }

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
};

export default function JotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { board, setIsChatOpen } = useBoardStore();
  const notes = useNoteStore((state) => state.notes);
  const highlightNotes = useNoteStore((state) => state.highlightNotes);
  const clearHighlightedNotes = useNoteStore(
    (state) => state.clearHighlightedNotes,
  );
  const highlightSections = useSectionStore((state) => state.highlightSections);
  const clearHighlightedSections = useSectionStore(
    (state) => state.clearHighlightedSections,
  );
  const { clearNoteContext, noteContextIds, removeNoteContext } =
    useChatContextStore();
  const contextNotes = noteContextIds
    .map((id) => notes.find((note) => note.id === id))
    .filter((note) => note !== undefined);

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

  const resizeInput = () => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const trimmedInput = input.trim();
    const contextSnapshot = contextNotes.map((note) => ({
      id: note.id,
      text: note.text,
      author_name: note.author_name,
      color: note.color,
      type: note.type,
    }));
    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        parts: [{ text: trimmedInput }],
        contextNotes: contextSnapshot,
      },
    ];
    setMessages(newMessages);
    setInput("");
    requestAnimationFrame(resizeInput);
    clearNoteContext();
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages: newMessages,
        boardId: board!.id, // need a board
        contextNoteIds: contextNotes.map((note) => note.id),
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

    if (data.clearHighlights) {
      clearHighlightedNotes();
      clearHighlightedSections();
    } else if (
      Array.isArray(data.highlightNoteIds) ||
      Array.isArray(data.highlightSectionIds)
    ) {
      highlightNotes(
        Array.isArray(data.highlightNoteIds) ? data.highlightNoteIds : [],
      );
      highlightSections(
        Array.isArray(data.highlightSectionIds) ? data.highlightSectionIds : [],
      );
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
            {m.role === "user" &&
              m.contextNotes &&
              m.contextNotes.length > 0 && (
                <div className="mb-2 flex max-w-[360px] gap-2 overflow-x-auto pb-1">
                  {m.contextNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{ width: 82, height: 82, minHeight: 0 }}
                      className={`note ${note.type} relative shrink-0 rounded-none border border-[rgba(0,0,0,0.14)] p-2 text-left`}
                    >
                      <div className="h-[54px] overflow-hidden text-[9px] leading-tight text-black">
                        {note.text || "Untitled note"}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 overflow-hidden text-ellipsis whitespace-nowrap text-[7px] text-[#7B7B7B]">
                        {note.author_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            <ChatText text={m.parts[0].text} />
          </div>
        ))}
        {loading && <div className="self-start text-gray-400">Thinking...</div>}
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
        <div className="bg-[var(--light-grey)] rounded-xl px-3 py-3">
          {contextNotes.length > 0 && (
            <div className="mb-3 flex max-h-[180px] gap-3 overflow-x-auto overflow-y-hidden pb-1">
              {contextNotes.map((note) => (
                <div
                  key={note.id}
                  style={{ width: 140, height: 140, minHeight: 0 }}
                  className={`note ${note.type} relative shrink-0 rounded-none border border-[rgba(0,0,0,0.12)] p-3 text-left`}
                >
                  <button
                    aria-label="Remove note from chat context"
                    className="absolute right-2 top-2 h-5 w-5 rounded-full bg-white text-xs leading-none shadow hover:bg-[var(--grey)]"
                    onClick={() => removeNoteContext(note.id)}
                  >
                    x
                  </button>
                  <div className="h-[96px] overflow-hidden pr-4 text-xs text-black">
                    {note.text || "Untitled note"}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#7B7B7B]">
                    {note.author_name}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end">
            <textarea
              ref={inputRef}
              rows={1}
              className="max-h-[180px] min-h-[32px] flex-1 resize-none overflow-y-auto bg-transparent py-1 text-sm leading-5 outline-none"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                requestAnimationFrame(resizeInput);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                sendMessage();
              }}
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
    </div>
  );
}
