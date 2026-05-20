import Anthropic from "@anthropic-ai/sdk";
import { matchAircraft, formatCandidatesForAI, getEntryByName, VisualFeatures } from "@/lib/aircraft-matcher";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FEATURE_EXTRACTION_PROMPT = `You are an aircraft visual analysis system. Examine this image and extract structured visual features. Do NOT try to identify the aircraft — just describe what you see.

Respond with JSON only (no markdown, no code fences):

{
  "engineCount": <number of engines visible or inferrable>,
  "engineType": "<piston|turboprop|turbofan|turbojet|turboshaft|electric>",
  "enginePlacement": "<under-wing|rear-fuselage|nose|embedded|nacelle|wing-mounted|fuselage-sides>",
  "wingPosition": "<high|mid|low|biplane|parasol|variable>",
  "wingShape": "<straight|swept|delta|forward-swept|variable-sweep|cranked-delta|trapezoidal>",
  "tailType": "<conventional|t-tail|triple|twin|v-tail|twin-boom|no-tail|cruciform|h-tail>",
  "landingGear": "<tricycle|taildragger|tandem|skids|retractable|fixed>",
  "sizeClass": "<ultralight|light|medium|large|heavy|super-heavy>",
  "era": "<pre-wwii|wwii|early-jet|cold-war|modern|contemporary>",
  "distinguishingFeatures": ["list", "of", "distinctive", "visual", "features"],
  "markings": "<any visible text, registration numbers, military insignia, logos — transcribe exactly what you can read>",
  "livery": "<description of paint scheme and colors>"
}

IMPORTANT VISUAL CUES TO CHECK:
- Count engines carefully. Look at BOTH wings. 4-engine aircraft have 2 per wing.
- Triple tail = 3 separate vertical stabilizers (Constellation, E-2 Hawkeye)
- Twin tail = 2 vertical stabilizers (F-14, F-15, F/A-18, A-10)
- T-tail = horizontal stabilizer mounted on TOP of vertical stabilizer
- High wing = wings above fuselage. Low wing = below. Mid = through middle.
- Taildragger = small wheel at tail, main wheels forward. Tricycle = nose wheel + main wheels.
- For size: light = Cessna-size, medium = regional jet, large = 737/A320, heavy = 747/777, super-heavy = An-225/A380
- Look for distinctive shapes: gull wings, cranked wings, forward canards, dorsal humps, bubble canopies, chin turrets, etc.`;

const PICK_CANDIDATE_PROMPT = `You are an aircraft identification expert. You have been given:
1. An image of an aircraft
2. Extracted visual features from the image
3. A ranked list of candidate aircraft from our database

Your job: Pick the BEST matching candidate, or if none match well, identify it yourself.

RULES:
- Your pick MUST be consistent with the visual features. If features say "4 engines, triple tail" then ONLY pick an aircraft with 4 engines and a triple tail.
- If one candidate clearly matches all features, pick it with "high" confidence.
- If 2-3 candidates are plausible, pick the most likely and say "medium" confidence.
- If no candidates match well, provide your own identification with the features observed.
- Read any visible markings/text — they are the strongest clue.

Respond with JSON only (no markdown, no code fences):

{
  "selectedCandidate": <1-based index of selected candidate, or 0 if none match>,
  "identified": true,
  "name": "Aircraft name (use candidate name if selected, or your own)",
  "confidence": "high|medium|low",
  "visualCues": "Explain which visual features confirmed your pick",
  "operator": "Operator/airline if identifiable, or null",
  "livery": "Livery description if identifiable, or null",
  "variant": "Specific variant if you can narrow it down, or null"
}`;

export async function POST(request: Request) {
  try {
    const { imageData, correction } = await request.json();

    if (!imageData) {
      return Response.json({ error: "No image data provided" }, { status: 400 });
    }

    const match = imageData.match(new RegExp("^data:(image/[^;]+);base64,([\\s\\S]+)"));
    if (!match) {
      return Response.json({ error: "Invalid image format." }, { status: 400 });
    }

    type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const supported: SupportedMedia[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const rawType = match[1];
    const mediaType: SupportedMedia = supported.includes(rawType as SupportedMedia)
      ? (rawType as SupportedMedia)
      : "image/jpeg";
    const base64Data = match[2].replace(/\s/g, "");

    const imageBlock = {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: mediaType,
        data: base64Data,
      },
    };

    // === CORRECTION FLOW ===
    if (correction) {
      const dbEntry = getEntryByName(correction);
      if (dbEntry) {
        // Found in database — return directly, no AI needed
        return Response.json({
          identified: true,
          name: dbEntry.name,
          manufacturer: dbEntry.manufacturer,
          type: dbEntry.type,
          variant: dbEntry.variant || null,
          natoReportingName: dbEntry.natoReportingName || null,
          firstFlight: dbEntry.firstFlight || null,
          inService: dbEntry.inService || null,
          role: dbEntry.role,
          country: dbEntry.country,
          specs: dbEntry.specs,
          confidence: "high" as const,
          visualCues: `Corrected by user. Key features: ${dbEntry.visual.distinguishingFeatures.join(", ")}`,
          description: dbEntry.description,
          funFact: dbEntry.funFact,
          livery: null,
          operator: null,
        });
      }

      // Not in database — ask AI
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              imageBlock,
              {
                type: "text",
                text: `This aircraft is a "${correction}". Provide full details. Respond with JSON only (no code fences): {"identified":true,"name":"...","manufacturer":"...","type":"...","variant":null,"natoReportingName":null,"firstFlight":"...","inService":"...","role":"...","country":"...","specs":{"wingspan":"...","length":"...","maxSpeed":"...","range":"...","ceiling":"...","engines":"...","crew":"...","capacity":"..."},"confidence":"high","visualCues":"...","description":"...","funFact":"...","livery":null,"operator":null}`,
              },
            ],
          },
        ],
      });
      const tb = response.content.find((b) => b.type === "text");
      if (!tb || tb.type !== "text") return Response.json({ error: "No AI response" }, { status: 500 });
      let jt = tb.text.trim();
      if (jt.startsWith("```")) jt = jt.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      return Response.json(JSON.parse(jt));
    }

    // === PASS 1: Extract structured visual features ===
    const featureResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: FEATURE_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            imageBlock,
            { type: "text", text: "Extract the visual features of this aircraft. JSON only." },
          ],
        },
      ],
    });

    const featureBlock = featureResponse.content.find((b) => b.type === "text");
    if (!featureBlock || featureBlock.type !== "text") {
      return Response.json({ error: "Feature extraction failed" }, { status: 500 });
    }

    let featureJson = featureBlock.text.trim();
    if (featureJson.startsWith("```")) {
      featureJson = featureJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const features: VisualFeatures = JSON.parse(featureJson);

    // === DATABASE MATCHING ===
    const candidates = matchAircraft(features, 10);

    if (candidates.length === 0) {
      // No database matches — fall back to full AI identification
      const fallbackResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              imageBlock,
              {
                type: "text",
                text: `Visual features observed: ${featureJson}\n\nIdentify this aircraft based on these features. Respond with JSON only (no code fences): {"identified":true,"name":"...","manufacturer":"...","type":"...","variant":null,"natoReportingName":null,"firstFlight":"...","inService":"...","role":"...","country":"...","specs":{"wingspan":"...","length":"...","maxSpeed":"...","range":"...","ceiling":"...","engines":"...","crew":"...","capacity":"..."},"confidence":"...","visualCues":"...","description":"...","funFact":"...","livery":null,"operator":null}`,
              },
            ],
          },
        ],
      });
      const fb = fallbackResponse.content.find((b) => b.type === "text");
      if (!fb || fb.type !== "text") return Response.json({ error: "No AI response" }, { status: 500 });
      let fjt = fb.text.trim();
      if (fjt.startsWith("```")) fjt = fjt.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      return Response.json(JSON.parse(fjt));
    }

    // === PASS 2: AI picks best candidate (lightweight) ===
    const candidateList = formatCandidatesForAI(candidates);

    const pickResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: PICK_CANDIDATE_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            imageBlock,
            {
              type: "text",
              text: `Visual features extracted:\n${featureJson}\n\nCandidate aircraft from database:\n${candidateList}\n\nWhich candidate best matches? JSON only.`,
            },
          ],
        },
      ],
    });

    const pickBlock = pickResponse.content.find((b) => b.type === "text");
    if (!pickBlock || pickBlock.type !== "text") {
      return Response.json({ error: "No AI response" }, { status: 500 });
    }

    let pickJson = pickBlock.text.trim();
    if (pickJson.startsWith("```")) {
      pickJson = pickJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const pick = JSON.parse(pickJson);
    const selectedIdx = (pick.selectedCandidate || 1) - 1;
    const selected = candidates[selectedIdx] || candidates[0];

    // Build response using database specs + AI's identification details
    return Response.json({
      identified: true,
      name: pick.name || selected.name,
      manufacturer: selected.manufacturer,
      type: selected.type,
      variant: pick.variant || selected.variant || null,
      natoReportingName: selected.natoReportingName || null,
      firstFlight: selected.firstFlight || null,
      inService: selected.inService || null,
      role: selected.role,
      country: selected.country,
      specs: selected.specs,
      confidence: pick.confidence || "medium",
      visualCues: pick.visualCues || "",
      description: selected.description,
      funFact: selected.funFact,
      livery: pick.livery || null,
      operator: pick.operator || null,
    });
  } catch (error: unknown) {
    console.error("Identification error:", error);

    const message =
      error instanceof SyntaxError
        ? "Failed to parse AI response"
        : error instanceof Error
          ? error.message
          : "Failed to identify aircraft";

    return Response.json({ error: message }, { status: 500 });
  }
}
