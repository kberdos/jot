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

	const { messages, boardId } = await req.json()

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

	let contents = [
		{
			role: "user",
			parts: [
				{
					text: `You are operating on boardId: ${boardId}.

Board context:
Notes: ${JSON.stringify(notes)}
Sections: ${JSON.stringify(sections)}

When the user asks to highlight, find, show, or visually identify notes or sections, call highlight_objects with the exact noteIds and sectionIds from the board context. Multiple objects may be highlighted at once. If the user asks to stop or clear highlighting, call stop_highlighting. For normal questions that do not need visual highlighting, answer normally.`,
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
