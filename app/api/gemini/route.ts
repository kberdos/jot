import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function GET() {
	const response = await ai.models.generateContent({
		model: "gemini-3-flash-preview",
		contents: "tell me a joke",
	});
	return Response.json({ text: response.text });
}
