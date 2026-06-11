import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

// Lazily construct the Anthropic client so importing this module never
// throws (e.g. during `next build` page-data collection, when env vars may
// not be available). The client is only created when a draft is requested.
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
  }
  return _client;
}

export const DRAFT_EMAIL_MODEL = "claude-sonnet-4-5-20250929";
