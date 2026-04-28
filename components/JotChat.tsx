"use client"
import { useState } from "react";
import { useBoardStore } from "@/util/objects/board";

interface Message {
	role: "user" | "model"
	parts: [{ text: string }]
}

export default function JotChat() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState("")
	const [loading, setLoading] = useState(false)
	const { board } = useBoardStore()

	const sendMessage = async () => {
		if (!input.trim()) return
		const newMessages: Message[] = [
			...messages,
			{ role: "user", parts: [{ text: input }] }
		]
		setMessages(newMessages)
		setInput("")
		setLoading(true)

		const res = await fetch("/api/gemini", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				messages: newMessages,
				boardId: board!.id, // need a board
			}),
		})

		if (!res.ok) {
			const text = await res.text()
			console.error("API error:", text)
			setLoading(false)
			return
		}

		let data
		try {
			data = await res.json()
		} catch (e) {
			console.error("Invalid JSON response:", e)
			setLoading(false)
			return
		}

		setMessages(prev => [...prev, { role: "model", parts: [{ text: data.text }] }])
		setLoading(false)
	}

	return (
		<div className="flex flex-col h-full">
			<div className="font-bold p-3 border-b">JotChat</div>
			<div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
				{messages.map((m, i) => (
					<div key={i} className={`p-2 rounded ${m.role === "user" ? "self-end bg-blue-100" : "self-start bg-gray-100"}`}>
						{m.parts[0].text}
					</div>
				))}
				{loading && <div className="self-start text-gray-400">thinking...</div>}
			</div>
			<div className="flex gap-2 p-3 border-t">
				<input
					className="flex-1 border rounded p-2"
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={e => e.key === "Enter" && sendMessage()}
					placeholder="Ask about your board..."
				/>
				<button className="border rounded px-3" onClick={sendMessage}>Send</button>
			</div>
		</div>
	)
}
