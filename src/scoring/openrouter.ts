import fetch from "node-fetch";
import { readFileSync } from "fs";
import { JudgmentResult } from "../tournament/types.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Converts image file to base64 data URL
 */
function imageToBase64(filePath: string): string {
  const imageBuffer = readFileSync(filePath);
  const base64 = imageBuffer.toString("base64");
  const mimeType = filePath.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Judges a pair of photos using OpenRouter API
 */
export async function judgePair(
  aPath: string,
  bPath: string,
  model: string = "anthropic/claude-3.5-sonnet"
): Promise<JudgmentResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not found in environment variables");
  }

  try {
    const imageA = imageToBase64(aPath);
    const imageB = imageToBase64(bPath);

    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/gooley/vibe-party-one",
        "X-Title": "Photo Tournament",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert photo judge.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You will be shown two JPEG photos, encoded as base64 data URLs A and B.
Pick the better photograph purely on overall visual appeal, storytelling, and emotional impact.
Point out the positives and negatives per photo, in addition to the overall comparison.
Reply ONLY with:
{
  "winner": "<a|b>",
  "explanation": "<≤40 words for comparison, and 20 words per photo>"
}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageA,
                },
              },
              {
                type: "text",
                text: "Photo A (above)",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageB,
                },
              },
              {
                type: "text",
                text: "Photo B (above)",
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as any;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenRouter response");
    }

    // The model sometimes returns the JSON wrapped in ```json ... ```
    // so we need to extract the JSON part.
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error(
        `No JSON object found in OpenRouter response: ${content}`
      );
    }
    const jsonString = jsonMatch[0];

    // Parse the JSON response
    const judgment = JSON.parse(jsonString) as JudgmentResult;

    // Validate the response
    if (!judgment.winner || !["a", "b"].includes(judgment.winner)) {
      throw new Error("Invalid winner in judgment response");
    }

    if (!judgment.explanation) {
      throw new Error("Invalid explanation in judgment response");
    }

    return judgment;
  } catch (error) {
    console.error("Error in judgePair:", error);

    // Fallback to random judgment if API fails
    return {
      winner: Math.random() > 0.5 ? "a" : "b",
      explanation: "Random fallback due to API error",
    };
  }
}
