// Using native fetch instead of axios — guaranteed compatibility with Next.js App Router

const SYSTEM_PROMPT =
  "You are CampusCare AI, a helpful assistant for college campus-related queries including academics, hostel, facilities, health services, events, and student welfare.";

// Verified active free models on OpenRouter (April 2026)
const FREE_MODELS = [
  "openrouter/free",                        // Auto-routes to best available free model
  "google/gemma-3-4b-it:free",              // Fast, lightweight
  "google/gemma-3-27b-it:free",             // Larger, higher quality
  "meta/llama-3.3-70b-instruct:free",       // Meta Llama
];

export async function POST(req: Request) {
  try {
    // 1. Parse & validate input
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return Response.json({ reply: "Please enter a message." }, { status: 400 });
    }

    // 2. Validate API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[CampusCare] ❌ OPENROUTER_API_KEY is missing from .env.local");
      return Response.json({ reply: "Server configuration error." }, { status: 500 });
    }

    console.log("[CampusCare] ✅ API key loaded:", apiKey.substring(0, 15) + "...");
    console.log("[CampusCare] 📨 User message:", message.trim().substring(0, 50));

    // 3. Try each model until one works
    for (const model of FREE_MODELS) {
      try {
        console.log(`[CampusCare] 🔄 Trying model: ${model}`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CampusCare AI",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: message.trim() },
            ],
          }),
        });

        console.log(`[CampusCare] 📡 Response status: ${response.status}`);

        // If model not found or rate limited, try next model
        if (response.status === 404) {
          console.warn(`[CampusCare] ⚠️ Model ${model} not found (404), trying next...`);
          continue;
        }
        if (response.status === 429) {
          console.warn(`[CampusCare] ⚠️ Rate limited on ${model} (429), trying next...`);
          continue;
        }
        if (response.status === 401) {
          console.error("[CampusCare] ❌ API key is invalid (401 Unauthorized)");
          return Response.json(
            { reply: "API key is invalid. Please check your OPENROUTER_API_KEY in .env.local" },
            { status: 401 }
          );
        }

        const data = await response.json();
        console.log("[CampusCare] 📦 Response data:", JSON.stringify(data).substring(0, 200));

        // Check for error in response body (OpenRouter sometimes returns 200 with error)
        if (data.error) {
          console.error(`[CampusCare] ❌ API error from ${model}:`, data.error);
          continue;
        }

        const replyContent = data?.choices?.[0]?.message?.content;

        if (replyContent) {
          console.log(`[CampusCare] ✅ Success with model: ${model}`);
          return Response.json({ reply: replyContent });
        }

        console.warn(`[CampusCare] ⚠️ Empty reply from ${model}, trying next...`);
      } catch (fetchErr) {
        console.error(`[CampusCare] ❌ Fetch error for model ${model}:`, fetchErr);
        continue;
      }
    }

    // All models failed
    console.error("[CampusCare] ❌ All models exhausted.");
    return Response.json(
      { reply: "All AI models are currently unavailable. Please try again later." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[CampusCare] ❌ Unexpected error:", error);
    return Response.json(
      { reply: "Sorry, something went wrong. Please try again." },
      { status: 500 }
    );
  }
}