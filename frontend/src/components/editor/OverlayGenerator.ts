import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AudioExporter } from "./AudioExporter";
import type { PixiEditor } from "./PixiEditor";
import {
	type OverlayElementText,
	OverlayElementTextSchema,
	type TimelineItemOverlay,
	TimelineItemOverlaySchema,
} from "./types";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class OverlayGenerator {
	public static async generate(
		editor: PixiEditor,
		apiKey: string,
	): Promise<TimelineItemOverlay[]> {
		// 1. Export Audio
		console.log("Exporting audio for overlay generation...");
		const { buffer, mimeType } = await AudioExporter.export(editor, "wav");

		// // download the audio
		// const a = document.createElement("a");
		// a.href = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
		// a.download = `audio_${Date.now()}.wav`;
		// a.click();
		// a.remove();

		// Convert to base64
		const base64Audio = await OverlayGenerator.bufferToBase64(buffer);

		// 2. Prepare GenAI
		const ai = new GoogleGenAI({ apiKey });

		const textSchema = z.object({
			startTime: z.number(),
			duration: z.number(),

			text: z.string(),
			position: z.enum(["top", "bottom", "center"]),
			size: z.enum(["small", "medium", "large"]),
			color: z
				.string()
				.describe("The color of the text, in hex format (e.g. #ffffff)."),
			backgroundColor: z
				.union([z.string(), z.literal("transparent")])
				.optional()
				.default("transparent"),
		});

		const jsonSchema = zodToJsonSchema(
			z.object({
				overlays: z.array(textSchema),
			}),
		);
		console.log("jsonSchema", jsonSchema);

		// 3. Call API
		console.log("Calling Gemini API...");
		const modelId = "gemini-2.5-flash";

		try {
			const response = await ai.models.generateContent({
				model: modelId,
				contents: [
					{
						role: "user",
						parts: [
							{
								text: `Listen to the audio and generate highlight text chunks that should appear in important moments. I will feature these chunks on the video, they're not captions but just emphasis. The chunks should be short and to the point.

                Highlight should together with the spoken phrase to ensure it is visible and in sync.
                Use 'top', 'bottom', or 'center' for position based on what makes sense. Ensure the output follows the JSON schema.`,
							},
							{
								inlineData: {
									mimeType: mimeType,
									data: base64Audio,
								},
							},
						],
					},
				],
				config: {
					responseMimeType: "application/json",
					responseSchema: jsonSchema as any,
				},
			});

			console.log("schema", jsonSchema);
			console.log("response", response);

			console.log("Gemini Response:", response.text);
			const result = JSON.parse(response.text || "[]");

			const resultParsed = OverlayElementTextSchema.array().parse(
				result.overlays.map((r: object) => ({ ...r, type: "text" })),
			);

			console.log("resultParsed", resultParsed);

			// Validate and return
			if (result && Array.isArray(result.overlays)) {
				// Ensure type is 'overlay' for all items (the schema should enforce this but just in case)
				return result.overlays.map((o: any) => ({
					type: "overlay",
					startTime: o.startTime,
					duration: o.duration,
					layout: [{ ...o, type: "text" }],
				}));
			}
			return [];
		} catch (error) {
			console.error("Overlay generation failed:", error);
			throw error;
		}
	}

	private static bufferToBase64(buffer: Uint8Array): Promise<string> {
		return new Promise((resolve, reject) => {
			const blob = new Blob([buffer], { type: "audio/mp3" });
			const reader = new FileReader();
			reader.onloadend = () => {
				const dataUrl = reader.result as string;
				const base64 = dataUrl.split(",")[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}
}
