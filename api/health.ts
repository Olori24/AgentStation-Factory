export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN),
    timestamp: new Date().toISOString(),
  });
}
