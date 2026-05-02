import {
	GoogleGenAI,
	Type,
	FunctionCallingConfigMode,
} from "@google/genai"
import { createClient } from "@supabase/supabase-js"

const ai = new GoogleGenAI({})
const MODEL_NAME = "gemini-3.1-flash-lite-preview"

const tools: any = [
	{
		functionDeclarations: [
			{
				name: "highlight_objects",
				description: "Highlight notes and sections on the user's board. Use this when the user asks to find, highlight, show, or visually identify notes or sections.",
				parameters: {
					type: Type.OBJECT,
					properties: {
						noteIds: {
							type: Type.ARRAY,
							description: "IDs of notes to highlight",
							items: { type: Type.STRING },
						},
						sectionIds: {
							type: Type.ARRAY,
							description: "IDs of sections to highlight",
							items: { type: Type.STRING },
						},
						responseText: {
							type: Type.STRING,
							description: "Short message explaining what was highlighted",
						},
					},
					required: ["noteIds", "sectionIds", "responseText"],
				},
			},
			{
				name: "stop_highlighting",
				description: "Clear all current note and section highlights. Use this when the user asks to stop, clear, or remove highlighting.",
				parameters: {
					type: Type.OBJECT,
					properties: {
						responseText: {
							type: Type.STRING,
							description: "Short message confirming highlighting was cleared",
						},
					},
					required: ["responseText"],
				},
			},
		],
	},
]

export async function POST(req: Request) {
	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	)

	const { messages, boardId, contextNoteIds = [] } = await req.json()

	const { data: notes, error: notesError } = await supabase
		.from("notes")
		.select("id,text,author_name,section_id")
		.eq("board_id", boardId)

	if (notesError) {
		return Response.json(
			{ error: "Failed to fetch notes" },
			{ status: 500 }
		)
	}

	const { data: sections, error: sectionsError } = await supabase
		.from("sections")
		.select("id,title")
		.eq("board_id", boardId)

	if (sectionsError) {
		return Response.json(
			{ error: "Failed to fetch sections" },
			{ status: 500 }
		)
	}

	const { data: arrows, error: arrowsError } = await supabase
		.from("arrows")
		.select("id,start_note_id,start_note_side,end_note_id,end_note_side")
		.eq("board_id", boardId)

	if (arrowsError) {
		return Response.json(
			{ error: "Failed to fetch arrows" },
			{ status: 500 }
		)
	}

	const noteById = new Map(notes.map(note => [note.id, note]))
	const contextNotes = notes.filter(note => contextNoteIds.includes(note.id))
	const directedConnections = arrows.map(arrow => {
		const startNote = noteById.get(arrow.start_note_id)
		const endNote = noteById.get(arrow.end_note_id)

		return {
			id: arrow.id,
			start_note_id: arrow.start_note_id,
			start_note_text: startNote?.text ?? "",
			start_note_author_name: startNote?.author_name ?? "",
			start_note_side: arrow.start_note_side,
			end_note_id: arrow.end_note_id,
			end_note_text: endNote?.text ?? "",
			end_note_author_name: endNote?.author_name ?? "",
			end_note_side: arrow.end_note_side,
		}
	})
	const contextConnections = contextNoteIds.map((noteId: string) => ({
		note_id: noteId,
		note_text: noteById.get(noteId)?.text ?? "",
		outgoing: directedConnections.filter(connection => connection.start_note_id === noteId),
		incoming: directedConnections.filter(connection => connection.end_note_id === noteId),
		connected_any_direction: directedConnections.filter(connection =>
			connection.start_note_id === noteId || connection.end_note_id === noteId
		),
	}))

	let contents = [
		{
			role: "user",
			parts: [
				{
					text: `You are operating on boardId: ${boardId}.

Board context:
Notes: ${JSON.stringify(notes)}
Sections: ${JSON.stringify(sections)}
Directed arrows: ${JSON.stringify(directedConnections)}

Current chat note context:
Context note IDs: ${JSON.stringify(contextNoteIds)}
Context notes: ${JSON.stringify(contextNotes)}
Context note arrow connections: ${JSON.stringify(contextConnections)}

Arrow direction rules:
- An arrow points FROM start_note_id TO end_note_id.
- If the user asks what a note "points to", "links to", or its outgoing connections, use arrows where start_note_id is that note.
- If the user asks what points to a note or incoming connections, use arrows where end_note_id is that note.
- If the user asks what a note is connected to without specifying direction, include both incoming and outgoing connections and label the direction.

When the user refers to selected notes, added notes, attached notes, these notes, this context, or asks for a summary/comparison/explanation without naming a broader target, prioritize the current chat note context. When the user asks to highlight, find, show, or visually identify notes or sections, call highlight_objects with the exact noteIds and sectionIds from the board context. Multiple objects may be highlighted at once. If the user asks to stop or clear highlighting, call stop_highlighting. For normal questions that do not need visual highlighting, answer normally.`,
				},
			],
		},
		...messages,
	]

	// max 3 attempts in the tool loop
	for (let i = 0; i < 3; i++) {
		const response = await ai.models.generateContent({
			model: MODEL_NAME,
			contents,
			config: {
				tools,
				toolConfig: {
					functionCallingConfig: {
						mode: FunctionCallingConfigMode.AUTO,
					},
				},
			},
		})

		const parts = response.candidates?.[0]?.content?.parts ?? []

		const functionCallPart = parts.find(
			(p: any) => p.functionCall?.name
		) as
			| {
				functionCall: {
					name: string
					args: any
				}
			}
			| undefined

		// call the tools
		if (functionCallPart?.functionCall) {
			const { name, args } = functionCallPart.functionCall

			if (name === "highlight_objects") {
				return Response.json({
					text: args?.responseText ?? "Highlighted matching objects.",
					highlightNoteIds: Array.isArray(args?.noteIds) ? args.noteIds : [],
					highlightSectionIds: Array.isArray(args?.sectionIds) ? args.sectionIds : [],
				})
			}

			if (name === "stop_highlighting") {
				return Response.json({
					text: args?.responseText ?? "Stopped highlighting.",
					highlightNoteIds: [],
					highlightSectionIds: [],
					clearHighlights: true,
				})
			}
		}

		// final response 
		const textPart = parts.find((p: any) => p.text)

		if (textPart?.text) {
			return Response.json({ text: textPart.text })
		}
	}

	return Response.json({
		text: "[No final response generated]",
	})
}
