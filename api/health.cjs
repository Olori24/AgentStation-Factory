module.exports = function handler(_req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    status: "ok",
    runtime: "vercel",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN)
  }));
};
