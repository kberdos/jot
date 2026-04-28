"use client"
import { useEffect, useState } from "react";

export default function JotChat() {
	const [res, setRes] = useState("")

	const getPrompt = async () => {
		const res = await fetch("/api/gemini");
		const data = await res.json();
		setRes(data.text)
	};

	useEffect(() => {
		// getPrompt()
	}, [])
	return (
		<>
			<div>
				JotChat
			</div>
			<div>
				{res}
			</div>
		</>
	)
}
