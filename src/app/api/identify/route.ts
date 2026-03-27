import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are AeroLens, an expert aircraft identification AI. When shown an image of an aircraft, you identify it with detailed information.

You MUST respond with valid JSON matching this exact schema (no markdown, no code fences, just raw JSON):

{
  "identified": true,
  "name": "Full aircraft designation (e.g. Boeing 747-400)",
  "manufacturer": "Manufacturer name",
  "type": "Category (e.g. Wide-body airliner, Fighter jet, Light aircraft, Helicopter, Military transport, Business jet, Turboprop, Biplane, etc.)",
  "variant": "Specific variant if identifiable, or null",
  "natoReportingName": "NATO reporting name if military and applicable, or null",
  "firstFlight": "Year or date of first flight if known, or null",
  "inService": "Service period (e.g. '1970-present', '1940-1955'), or null",
  "role": "Primary role (e.g. Commercial passenger transport, Air superiority fighter, etc.)",
  "country": "Country of origin",
  "specs": {
    "wingspan": "Wingspan measurement or null",
    "length": "Length measurement or null",
    "maxSpeed": "Maximum speed or null",
    "range": "Range or null",
    "ceiling": "Service ceiling or null",
    "engines": "Engine description or null",
    "crew": "Crew complement or null",
    "capacity": "Passenger/cargo capacity or null"
  },
  "confidence": "high, medium, or low",
  "description": "2-3 sentence description of the aircraft, its significance, and history",
  "funFact": "An interesting or surprising fact about this aircraft",
  "livery": "Airline or operator livery if identifiable from markings, or null",
  "operator": "Specific operator/airline if identifiable, or null"
}

If the image does not contain an aircraft or you cannot identify one, respond with:
{"identified": false, "name": "Unknown", "manufacturer": "Unknown", "type": "Unknown", "role": "Unknown", "country": "Unknown", "specs": {}, "confidence": "low", "description": "Could not identify an aircraft in this image.", "funFact": ""}

Be precise. If you can narrow down to a specific variant (e.g. 737-800 vs 737-900), do so. If the livery or tail markings are visible, identify the operator. Use your vast aviation knowledge to provide accurate specifications.`;

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return Response.json({ error: "No image data provided" }, { status: 400 });
    }

    // Extract base64 data and media type from data URL
    const match = imageData.match(
      /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/
    );
    if (!match) {
      return Response.json(
        { error: "Invalid image format. Please use JPEG, PNG, GIF, or WebP." },
        { status: 400 }
      );
    }

    const mediaType = match[1] as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    const base64Data = match[2];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Identify this aircraft. Respond with JSON only.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const result = JSON.parse(textBlock.text);
    return Response.json(result);
  } catch (error) {
    console.error("Identification error:", error);
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
    return Response.json(
      { error: "Failed to identify aircraft. Please try again." },
      { status: 500 }
    );
  }
}
