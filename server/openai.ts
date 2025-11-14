import OpenAI from "openai";

let client: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const OPENAI_ENABLED = !!client;

export function getOpenAI(): OpenAI | null {
  return client;
}

export function requireOpenAI(): OpenAI {
  if (!client) {
    throw new Error("OPENAI_API_KEY not set; AI features are disabled in this environment.");
  }
  return client;
}

export default { getOpenAI, requireOpenAI, OPENAI_ENABLED };
