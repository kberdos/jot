import { createClient } from "@supabase/supabase-js"

type SharedBoard = {
	id: string
	name: string
	author: string
	last_modified_by: string | null
	created_at: string | null
	last_updated_at: string | null
	owner_email?: string
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

export async function GET(req: Request) {
	const supabase = getSupabaseAdmin()
	const token = getBearerToken(req)

	if (!token) {
		return Response.json({ error: "Missing auth token" }, { status: 401 })
	}

	const { data: authData, error: authError } = await supabase.auth.getUser(token)

	if (authError || !authData.user) {
		return Response.json({ error: "Invalid auth token" }, { status: 401 })
	}

	const { data: memberships, error: membershipError } = await supabase
		.from("board_members")
		.select("board_id")
		.eq("user_id", authData.user.id)

	if (membershipError) {
		return Response.json({ error: membershipError.message }, { status: 500 })
	}

	const boardIds = memberships.map(member => member.board_id)

	if (boardIds.length === 0) {
		return Response.json({ boards: [] })
	}

	const { data: boards, error: boardsError } = await supabase
		.from("boards")
		.select("*")
		.in("id", boardIds)
		.order("last_updated_at", { ascending: false, nullsFirst: false })

	if (boardsError) {
		return Response.json({ error: boardsError.message }, { status: 500 })
	}

	const sharedBoards = (boards as SharedBoard[]).filter(board => board.author !== authData.user.id)

	const boardsWithOwners = await Promise.all(sharedBoards.map(async board => {
		const { data } = await supabase.auth.admin.getUserById(board.author)

		return {
			...board,
			created_at: board.created_at ?? null,
			last_updated_at: board.last_updated_at ?? null,
			owner_email: data.user?.email ?? "Unknown user",
		}
	}))

	return Response.json({ boards: boardsWithOwners })
}
