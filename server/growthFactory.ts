import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

export const growthRouter = Router();

growthRouter.get("/mpt-health", async (_req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.json({ configured:false, status:"not_configured" });
  try {
    const r = await fetch(base + "/api/v1/ping", { signal: AbortSignal.timeout(5000) });
    res.status(r.ok ? 200 : 502).json({ configured:true, status:r.ok?"online":"offline", code:r.status, baseUrl:base });
  } catch (e:any) {
    res.status(502).json({ configured:true, status:"offline", baseUrl:base, error:e?.message||"connection failed" });
  }
});

growthRouter.post("/campaign", async (req, res) => {
  const { project, objective, platforms=["facebook","instagram","tiktok"], durationDays=30 } = req.body || {};
  if (!project?.name || !objective) return res.status(400).json({ error:"project and objective are required" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error:"GEMINI_API_KEY is not configured" });
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the Growth Director inside an internal revenue engine.
Create a practical short-form campaign blueprint for:
PROJECT: ${project.name}
AUDIENCE: ${project.audience}
OFFER: ${project.offer}
OBJECTIVE: ${objective}
PLATFORMS: ${platforms.join(", ")}
DURATION: ${durationDays} days

Return ONLY valid JSON:
{"name":"...","positioning":"...","angles":[{"hook":"...","format":"...","cta":"...","conversionGoal":"..."}],"weeklyPlan":[{"week":1,"focus":"...","posts":7}],"leadPath":["content","conversation","qualification","offer"],"tracking":{"campaignIdPattern":"...","events":["view","click","lead","qualified","sale"]}}
Make hooks specific, non-generic and suitable for Nigerian/African audiences where relevant. Do not promise guaranteed income.`;
    const response = await ai.models.generateContent({ model:"gemini-2.5-flash", contents:prompt });
    const raw = response.text?.trim() || "{}";
    const cleaned = raw.replace(/^\`\`\`json\s*/,"").replace(/\s*\`\`\`$/,"");
    let campaign:any;
    try { campaign = JSON.parse(cleaned); } catch { campaign = { name:`${project.name} Growth Campaign`, positioning:raw, angles:[] }; }
    res.json({ success:true, campaign, generatedAt:new Date().toISOString(), engine:"growth-factory" });
  } catch (e:any) {
    res.status(500).json({ error:e?.message||"campaign generation failed" });
  }
});


growthRouter.post("/render", async (req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.status(503).json({ error:"MONEYPRINTERTURBO_URL is not configured" });
  const { subject, script="", language="", campaignId="", voiceName="" } = req.body || {};
  if (!subject) return res.status(400).json({ error:"subject is required" });
  const payload = {
    video_subject: subject,
    video_script: script,
    video_language: language,
    video_aspect: "9:16",
    video_count: 1,
    subtitle_enabled: true,
    video_source: "pexels",
    voice_name: voiceName,
    paragraph_number: 1,
    video_script_prompt: campaignId ? `Campaign ID: ${campaignId}` : "",
  };
  try {
    const headers:any = { "Content-Type":"application/json" };
    if (process.env.MONEYPRINTERTURBO_API_KEY) headers["Authorization"] = `Bearer ${process.env.MONEYPRINTERTURBO_API_KEY}`;
    const r = await fetch(base + "/api/v1/videos", { method:"POST", headers, body:JSON.stringify(payload), signal:AbortSignal.timeout(10000) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) return res.status(502).json({ error:"MoneyPrinterTurbo rejected render job", status:r.status, details:data });
    res.json({ success:true, provider:"moneyprinterturbo", campaignId, task:data?.data?.task_id || data?.task_id || null, raw:data });
  } catch(e:any) {
    res.status(502).json({ error:e?.message||"MoneyPrinterTurbo render request failed" });
  }
});

growthRouter.get("/render/:taskId", async (req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.status(503).json({ error:"MONEYPRINTERTURBO_URL is not configured" });
  try {
    const headers:any = {};
    if (process.env.MONEYPRINTERTURBO_API_KEY) headers["Authorization"] = `Bearer ${process.env.MONEYPRINTERTURBO_API_KEY}`;
    const r = await fetch(base + "/api/v1/tasks/" + encodeURIComponent(req.params.taskId), { headers, signal:AbortSignal.timeout(5000) });
    const data = await r.json().catch(()=>({}));
    res.status(r.ok?200:502).json(data);
  } catch(e:any) {
    res.status(502).json({ error:e?.message||"MoneyPrinterTurbo task lookup failed" });
  }
});
