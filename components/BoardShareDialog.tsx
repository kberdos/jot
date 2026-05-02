"use client"

import { FormEvent, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { Board } from "@/util/objects/board"
import { supabase } from "@/util/supabase/supabase"

type AccessPerson = {
	user_id: string
	email: string
	role: "owner" | "editor"
	is_owner: boolean
}

const getAccessToken = async () => {
	const { data } = await supabase.auth.getSession()
	return data.session?.access_token ?? null
}

export default function BoardShareDialog(props: {
	board: Board
	user: User
	onClose: () => void
}) {
	const [email, setEmail] = useState("")
	const [people, setPeople] = useState<AccessPerson[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSharing, setIsSharing] = useState(false)
	const [message, setMessage] = useState("")
	const [error, setError] = useState("")

	useEffect(() => {
		let cancelled = false

		const loadPeople = async () => {
			setIsLoading(true)
			setError("")

			const token = await getAccessToken()
			if (!token) {
				if (!cancelled) {
					setError("Please sign in again before sharing.")
					setIsLoading(false)
				}
				return
			}

			try {
				const response = await fetch(`/api/board-share?boardId=${props.board.id}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()

				if (cancelled) return

				if (!response.ok) {
					setError(data.error ?? "Could not load sharing details.")
				} else {
					setPeople(data.people ?? [])
				}
			} catch {
				if (!cancelled) setError("Could not load sharing details.")
			}

			setIsLoading(false)
		}

		loadPeople()

		return () => {
			cancelled = true
		}
	}, [props.board.id])

	const handleShare = async (event: FormEvent) => {
		event.preventDefault()
		setIsSharing(true)
		setError("")
		setMessage("")

		const token = await getAccessToken()
		if (!token) {
			setError("Please sign in again before sharing.")
			setIsSharing(false)
			return
		}

		try {
			const response = await fetch("/api/board-share", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					boardId: props.board.id,
					email,
				}),
			})
			const data = await response.json()

			if (!response.ok) {
				setError(data.error ?? "Could not share this board.")
			} else {
				setPeople(data.people ?? [])
				setEmail("")
				setMessage("Board shared.")
			}
		} catch {
			setError("Could not share this board.")
		}

		setIsSharing(false)
	}

	const handleCopyLink = async () => {
		await navigator.clipboard.writeText(window.location.href)
		setMessage("Link copied.")
		setError("")
	}

	return (
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/60"
			onPointerDown={(e) => {
				e.stopPropagation()
				props.onClose()
			}}
		>
			<div
				className="w-[420px] rounded-[8px] border border-[var(--grey)] bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-start justify-between gap-4">
					<h3 className="text-large font-medium">
						Share “{props.board.name}”
					</h3>
					<button
						aria-label="Close sharing dialog"
						className="rounded-[6px] px-2 py-1 text-xl leading-none hover:bg-[var(--light-grey)]"
						onClick={props.onClose}
					>
						×
					</button>
				</div>

				<form className="mb-4 flex gap-2" onSubmit={handleShare}>
					<input
						type="email"
						value={email}
						placeholder="Add email"
						className="min-w-0 flex-1 rounded-[8px] border border-[var(--grey)] px-3 py-2 text-large outline-none focus:border-[var(--blue)]"
						onChange={(e) => setEmail(e.target.value)}
					/>
					<button
						type="submit"
						disabled={isSharing || email.trim().length === 0}
						className="button button-small grey-button disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSharing ? "Sharing..." : "Share"}
					</button>
				</form>

				<div className="mb-4">
					<p className="mb-1 text-large font-semibold">People with access:</p>
					{isLoading ? (
						<p className="text-large text-grey">Loading...</p>
					) : (
						<ul className="space-y-1">
							{people.map(person => (
								<li key={person.user_id} className="text-large">
									{person.email}
									{person.user_id === props.user.id ? " (you)" : ""}
									{person.is_owner ? " - owner" : ""}
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						className="button button-small grey-button"
						onClick={handleCopyLink}
					>
						Copy link
					</button>
					{message && <p className="text-large text-grey">{message}</p>}
					{error && <p className="text-large text-red-600">{error}</p>}
				</div>
			</div>
		</div>
	)
}
