import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway";
import { products, type Product } from "./wearbuy-data";

const InputSchema = z.object({
  message: z.string().optional().default(""),
  imageDataUrl: z.string().optional(),
  mode: z.string().optional(),
});

export type StylistResponse = {
  reply: string;
  vibe?: string;
  detected?: string;
  productIds: string[];
};

function inventorySummary(): string {
  return products
    .map((p) => `${p.id} | ${p.name} | ${p.category} | tags:${p.tags.join(",")} | ${p.price} | ${p.store}`)
    .join("\n");
}

export const askStylist = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<StylistResponse> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { reply: "AI is offline right now. Try again soon ✨", productIds: [] };
    }
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are WearBuy's AI Stylist — a Gen-Z fashion bestie with main-character energy.
Speak like a stylish friend (short, punchy, hype). Use phrases like "clean fit", "main character energy", "unlocked", "tap in".
Always recommend ONLY from the WearBuy inventory below. Pick 3-5 product IDs that build a complete look.
Return ONLY valid JSON, no markdown fences. Schema:
{"reply":"1-2 sentence stylish caption","vibe":"streetwear|old money|clean girl|y2k|ethnic|korean minimal|airport|college|date night|party","detected":"short description of uploaded item OR empty","productIds":["p1","p3",...]}

INVENTORY:
${inventorySummary()}`;

    const userParts: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [];
    const text = [data.message, data.mode ? `Style mode: ${data.mode}` : ""].filter(Boolean).join(" — ");
    userParts.push({ type: "text", text: text || "Build me a complete look from the uploaded item." });
    if (data.imageDataUrl) userParts.push({ type: "image", image: data.imageDataUrl });

    try {
      const { text: out } = await generateText({
        model,
        system,
        messages: [{ role: "user", content: userParts }],
      });
      const cleaned = out.replace(/```json|```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : { reply: out, productIds: [] };
      const validIds: string[] = (parsed.productIds || []).filter((id: string) =>
        products.some((p: Product) => p.id === id),
      );
      return {
        reply: parsed.reply || "Here's a fit for you ✨",
        vibe: parsed.vibe,
        detected: parsed.detected,
        productIds: validIds,
      };
    } catch (e) {
      console.error("[stylist]", e);
      return { reply: "AI hit a snag. Try again in a sec.", productIds: [] };
    }
  });