import {
	GoogleGenAI,
	Type,
	FunctionCallingConfigMode,
} from "@google/genai"
import { createClient } from "@supabase/supabase-js"

const ai = new GoogleGenAI({})
const MODEL_NAME = "gemini-3.1-flash-lite-preview"

const tools = [
	{
		functionDeclarations: [
			{
				name: "get_notes",
				description: "Get all notes for a specific board",
				parameters: {
					type: Type.OBJECT,
					properties: {
						boardId: {
							type: Type.STRING,
							description: "The ID of the board",
						},
					},
					required: ["boardId"],
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

	let contents = [
		{
			role: "user",
			parts: [
				{
					text: `You are operating on boardId: ${boardId}. Use tools when the user asks.`,
				},
			],
		},
		...messages,
	]

	let usedTool = false

	// max 3 attempts in the tool loop
	for (let i = 0; i < 3; i++) {
		const response = await ai.models.generateContent({
			model: MODEL_NAME,
			contents,
			config: usedTool
				? {}
				: {
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
			usedTool = true

			const { name, args } = functionCallPart.functionCall

			if (name === "get_notes") {
				const boardIdArg = args?.boardId as string | undefined

				if (!boardIdArg) {
					return Response.json(
						{ error: "Missing boardId" },
						{ status: 400 }
					)
				}

				const { data: notes, error } = await supabase
					.from("notes")
					.select("*")
					.eq("board_id", boardIdArg)

				if (error) {
					return Response.json(
						{ error: "Failed to fetch notes" },
						{ status: 500 }
					)
				}

				// feed tool result back into model
				contents.push(
					{
						role: "model",
						parts: [
							{
								functionCall: functionCallPart.functionCall,
							},
						],
					},
					{
						role: "user",
						parts: [
							{
								functionResponse: {
									name: "get_notes",
									response: { notes },
								},
							},
						],
					},
					{
						role: "user",
						parts: [
							{
								text:
									"Use the provided notes to answer the user. Do NOT call tools again.",
							},
						],
					}
				)

				continue
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
