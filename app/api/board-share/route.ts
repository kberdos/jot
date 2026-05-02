import { createClient } from "@supabase/supabase-js"

type BoardMemberRow = {
	board_id: string
	user_id: string
	role: string | null
}

type AccessPerson = {
	user_id: string
	email: string
	role: "owner" | "editor"
	is_owner: boolean
}

const getSupabaseAdmin = () =>
	createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	)

const getBearerToken = (req: Request) => {
	const header = req.headers.get("authorization")
	if (!header?.startsWith("Bearer ")) return null
	return header.slice("Bearer ".length)
}

const getCurrentUser = async (req: Request, supabase = getSupabaseAdmin()) => {
	const token = getBearerToken(req)
	if (!token) return { user: null, error: "Missing auth token" }

	const { data, error } = await supabase.auth.getUser(token)
	if (error || !data.user) {
		return { user: null, error: "Invalid auth token" }
	}

	return { user: data.user, error: null }
}

const findUserByEmail = async (
	supabase: ReturnType<typeof getSupabaseAdmin>,
	email: string,
) => {
	const normalizedEmail = email.trim().toLowerCase()
	let page = 1

	while (true) {
		const { data, error } = await supabase.auth.admin.listUsers({
			page,
			perPage: 1000,
		})

		if (error) throw error

		const user = data.users.find(candidate =>
			candidate.email?.toLowerCase() === normalizedEmail
		)
		if (user) return user

		if (data.users.length < 1000) return null
		page += 1
	}
}

const getUserEmail = async (
	supabase: ReturnType<typeof getSupabaseAdmin>,
	userId: string,
) => {
	const { data, error } = await supabase.auth.admin.getUserById(userId)
	if (error) return "Unknown user"
	return data.user?.email ?? "Unknown user"
}

const getPeopleWithAccess = async (
	supabase: ReturnType<typeof getSupabaseAdmin>,
	boardId: string,
	boardAuthorId: string,
): Promise<AccessPerson[]> => {
	const { data: members, error } = await supabase
		.from("board_members")
		.select("board_id,user_id,role")
		.eq("board_id", boardId)

	if (error) throw error

	const peopleById = new Map<string, AccessPerson>()
	const ownerEmail = await getUserEmail(supabase, boardAuthorId)

	peopleById.set(boardAuthorId, {
		user_id: boardAuthorId,
		email: ownerEmail,
		role: "owner",
		is_owner: true,
	})

	await Promise.all((members as BoardMemberRow[]).map(async member => {
		if (member.user_id === boardAuthorId) return

		peopleById.set(member.user_id, {
			user_id: member.user_id,
			email: await getUserEmail(supabase, member.user_id),
			role: "editor",
			is_owner: false,
		})
	}))

	return Array.from(peopleById.values())
}

export async function GET(req: Request) {
	const supabase = getSupabaseAdmin()
	const { user, error: authError } = await getCurrentUser(req, supabase)

	if (authError || !user) {
		return Response.json({ error: authError }, { status: 401 })
	}

	const { searchParams } = new URL(req.url)
	const boardId = searchParams.get("boardId")

	if (!boardId) {
		return Response.json({ error: "Missing boardId" }, { status: 400 })
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("id,name,author")
		.eq("id", boardId)
		.single()

	if (boardError || !board) {
		return Response.json({ error: "Board not found" }, { status: 404 })
	}

	const { data: requesterMembership, error: membershipError } = await supabase
		.from("board_members")
		.select("board_id")
		.eq("board_id", boardId)
		.eq("user_id", user.id)
		.maybeSingle()

	if (membershipError) {
		return Response.json({ error: "Failed to check access" }, { status: 500 })
	}

	if (board.author !== user.id && !requesterMembership) {
		return Response.json({ error: "Forbidden" }, { status: 403 })
	}

	const people = await getPeopleWithAccess(supabase, boardId, board.author)
	return Response.json({ people })
}

export async function POST(req: Request) {
	const supabase = getSupabaseAdmin()
	const { user, error: authError } = await getCurrentUser(req, supabase)

	if (authError || !user) {
		return Response.json({ error: authError }, { status: 401 })
	}

	const body = await req.json()
	const boardId = typeof body.boardId === "string" ? body.boardId : ""
	const email = typeof body.email === "string" ? body.email.trim() : ""

	if (!boardId || !email) {
		return Response.json({ error: "Missing boardId or email" }, { status: 400 })
	}

	const { data: board, error: boardError } = await supabase
		.from("boards")
		.select("id,name,author")
		.eq("id", boardId)
		.single()

	if (boardError || !board) {
		return Response.json({ error: "Board not found" }, { status: 404 })
	}

	if (board.author !== user.id) {
		return Response.json({ error: "Only the board owner can share this board" }, { status: 403 })
	}

	const targetUser = await findUserByEmail(supabase, email)
	if (!targetUser) {
		return Response.json({ error: "No user found with that email" }, { status: 404 })
	}

	if (targetUser.id !== board.author) {
		const { error: insertError } = await supabase
			.from("board_members")
			.upsert(
				{
					board_id: boardId,
					user_id: targetUser.id,
					role: "editor",
				},
				{ onConflict: "board_id,user_id" },
			)

		if (insertError) {
			return Response.json({ error: insertError.message }, { status: 500 })
		}
	}

	const people = await getPeopleWithAccess(supabase, boardId, board.author)
	return Response.json({ people })
}
