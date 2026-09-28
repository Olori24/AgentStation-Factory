import crypto from "crypto";

const DEFAULT_BASE_URL = "https://api.agentrouter.to/api/agentic-api";

export interface AgentRouterChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  user: string;
}

export interface AgentRouterChatResult {
  text: string;
  raw: any;
  requestId: string;
  provider?: string;
  model?: string;
}

function getConfig() {
  const apiKey = process.env.AGENTIC_API_KEY?.trim();
  const baseUrl = (process.env.AGENTIC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  return { apiKey, baseUrl };
}

async function request(path: string, init: RequestInit = {}) {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) {
    throw new Error("AGENTIC_API_KEY is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }

  if (!response.ok) {
    const message = body?.error?.message || body?.message || body?.error || `AgentRouter HTTP ${response.status}`;
    throw new Error(String(message));
  }

  return body;
}

export function isAgentRouterConfigured() {
  return Boolean(getConfig().apiKey);
}

export function getAgentRouterConfigStatus() {
  const { baseUrl, apiKey } = getConfig();
  return {
    configured: Boolean(apiKey),
    baseUrl,
    keyPresent: Boolean(apiKey),
    keyPrefix: apiKey ? apiKey.slice(0, 8) + "…" : null,
  };
}

export async function agentRouterChat(options: AgentRouterChatOptions): Promise<AgentRouterChatResult> {
  const requestId = crypto.randomUUID();
  const body = await request("/domains/models/capabilities/chat/execute", {
    method: "POST",
    body: JSON.stringify({
      model: options.model || process.env.AGENTIC_MODEL || "gpt-5-mini",
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: options.user },
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 4000,
      requestId,
      allowFallback: true,
    }),
  });

  const text =
    body?.choices?.[0]?.message?.content ??
    body?.output_text ??
    body?.text ??
    body?.result?.text ??
    body?.result?.output_text ??
    "";

  if (!String(text).trim()) {
    throw new Error("AgentRouter returned no text content");
  }

  return {
    text: String(text),
    raw: body,
    requestId,
    provider: body?.provider || body?.route?.provider,
    model: body?.model || options.model,
  };
}

export async function agentRouterWallet() {
  return request("/wallet");
}

export async function agentRouterUsage(limit = 20) {
  return request(`/usage?limit=${Math.max(1, Math.min(100, limit))}`);
}
