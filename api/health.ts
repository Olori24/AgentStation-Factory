import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN),
    timestamp: new Date().toISOString(),
  });
}
