/**
 * Unified AI Provider
 * Supports multiple AI backends with automatic fallback
 * Priority: Groq (free) → OpenAI → Fallback
 */

import OpenAI from "openai";

type AIProvider = "groq" | "openai" | "gemini" | "fallback";

interface AIConfig {
  provider: AIProvider;
  client: OpenAI | null;
  model: string;
}

let config: AIConfig = {
  provider: "fallback",
  client: null,
  model: "fallback",
};

// Initialize the best available AI provider
function initializeProvider(): void {
  // Priority 1: Groq (FREE, fastest)
  if (process.env.GROQ_API_KEY) {
    config = {
      provider: "groq",
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.1-70b-versatile", // Best free model
    };
    console.log("✅ AI Provider: Groq (FREE tier - Llama 3.1 70B)");
    return;
  }

  // Priority 2: Google Gemini (FREE tier available)
  if (process.env.GOOGLE_AI_KEY) {
    config = {
      provider: "gemini",
      client: new OpenAI({
        apiKey: process.env.GOOGLE_AI_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      }),
      model: "gemini-1.5-flash", // Fast and free
    };
    console.log("✅ AI Provider: Google Gemini (FREE tier)");
    return;
  }

  // Priority 3: OpenAI (paid but reliable)
  if (process.env.OPENAI_API_KEY) {
    config = {
      provider: "openai",
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      model: "gpt-4o-mini", // Cheapest good model
    };
    console.log("✅ AI Provider: OpenAI (GPT-4o-mini)");
    return;
  }

  // Fallback: No AI available
  console.log("⚠️ AI Provider: None configured - using algorithmic fallback");
  console.log("   Set GROQ_API_KEY (free) for AI features: https://console.groq.com/keys");
}

// Initialize on module load
initializeProvider();

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return config.client !== null;
}

/**
 * Get current provider name
 */
export function getProviderName(): string {
  return config.provider;
}

/**
 * Get the AI client (throws if not available)
 */
export function requireAI(): { client: OpenAI; model: string; provider: AIProvider } {
  if (!config.client) {
    throw new Error(
      "No AI provider configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY in your environment."
    );
  }
  return {
    client: config.client,
    model: config.model,
    provider: config.provider,
  };
}

/**
 * Get the AI client (returns null if not available)
 */
export function getAI(): { client: OpenAI; model: string; provider: AIProvider } | null {
  if (!config.client) return null;
  return {
    client: config.client,
    model: config.model,
    provider: config.provider,
  };
}

/**
 * Generate a chat completion with the configured provider
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const ai = requireAI();
  
  const { maxTokens = 1000, temperature = 0.7, jsonMode = true } = options;

  const response = await ai.client.chat.completions.create({
    model: ai.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
    ...(jsonMode && ai.provider !== "gemini" ? { response_format: { type: "json_object" } } : {}),
  });

  return response.choices[0]?.message?.content || "{}";
}

/**
 * Generate completion with image input (for progress photos)
 */
export async function generateVisionCompletion(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const ai = requireAI();
  
  const { maxTokens = 1000, temperature = 0.7 } = options;

  // Vision model mapping
  const visionModel = ai.provider === "groq" 
    ? "llama-3.2-90b-vision-preview"  // Groq's vision model
    : ai.provider === "gemini"
    ? "gemini-1.5-flash"  // Gemini has built-in vision
    : "gpt-4o-mini";  // OpenAI

  const response = await ai.client.chat.completions.create({
    model: visionModel,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || "{}";
}

export default {
  isAIAvailable,
  getProviderName,
  requireAI,
  getAI,
  generateCompletion,
  generateVisionCompletion,
};
