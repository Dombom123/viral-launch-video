import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AudioExporter } from "./AudioExporter";
import type { PixiEditor } from "./PixiEditor";
import type { TimelineItemOverlay } from "./types";

// biome-ignore lint/complexity/noStaticOnlyClass: OverlayGenerator is a utility class
export class OverlayGenerator {
	public static async generate(
		editor: PixiEditor,
		apiKey: string,
		options: {
			userPrompt?: string;
			currentOverlays?: TimelineItemOverlay[];
		} = {},
	): Promise<TimelineItemOverlay[]> {
		// 1. Export Audio
		console.log("Exporting audio for overlay generation...");
		const { buffer, mimeType } = await AudioExporter.export(editor, "wav");

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

		// 3. Construct Prompt
		let promptText = `Listen to the audio and generate highlight text chunks that should appear in important moments. I will feature these chunks on the video, they're not captions but just emphasis. The chunks should be short and to the point.

Highlight should together with the spoken phrase to ensure it is visible and in sync.
Use 'top', 'bottom', or 'center' for position based on what makes sense. Ensure the output follows the JSON schema.`;

		if (
			options.userPrompt &&
			options.currentOverlays &&
			options.currentOverlays.length > 0
		) {
			// Extract just the text data for the prompt to keep it cleaner
			const simplifiedOverlays = options.currentOverlays.map((o) => ({
				startTime: o.startTime,
				duration: o.duration,
				// Assuming single text element layout for now as per schema above
				// biome-ignore lint/suspicious/noExplicitAny: schema compatibility
				...(o.layout[0] as any),
			}));

			promptText = `
Listen to the audio.
Here is the current list of text overlays in JSON format:
${JSON.stringify(simplifiedOverlays)}

The user wants to make the following correction/update:
"${options.userPrompt}"

Please generate the UPDATED full list of text overlays.
Ensure the output follows the JSON schema.
`;
		}

		// 4. Call API
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
								text: promptText,
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
					// biome-ignore lint/suspicious/noExplicitAny: schema compatibility
					responseSchema: jsonSchema as any,
				},
			});

			const responseText = response.text || "";
			console.log("Gemini Response:", responseText);
			const result = JSON.parse(
				typeof responseText === "string" ? responseText : "{}",
			);

			// Validate and return
			if (result && Array.isArray(result.overlays)) {
				// Ensure type is 'overlay' for all items (the schema should enforce this but just in case)
				// biome-ignore lint/suspicious/noExplicitAny: schema compatibility
				return result.overlays.map((o: any) => ({
					type: "overlay",
					startTime: o.startTime,
					duration: o.duration,
					// biome-ignore lint/suspicious/noExplicitAny: schema compatibility
					layout: [{ ...o, type: "text" } as any],
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
			const blob = new Blob([buffer as unknown as BlobPart], {
				type: "audio/wav",
			});
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
