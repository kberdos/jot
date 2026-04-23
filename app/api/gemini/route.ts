import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function GET() {
	const response = await ai.models.generateContent({
		model: "gemini-3-flash-preview",
		contents: "Explain how AI works in a few words",
	});
	return Response.json({ text: response.text });
}
