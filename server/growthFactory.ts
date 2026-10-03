import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { agentRouterChat, isAgentRouterConfigured } from "./agentRouter";

export const growthRouter = Router();

growthRouter.get("/mpt-health", async (_req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.json({ configured: false, status: "not_configured" });
  try {
    const r = await fetch(base + "/api/v1/ping", { signal: AbortSignal.timeout(5000) });
    res.status(r.ok ? 200 : 502).json({ configured: true, status: r.ok ? "online" : "offline", code: r.status, baseUrl: base });
  } catch (e: any) {
    res.status(502).json({ configured: true, status: "offline", baseUrl: base, error: e?.message || "connection failed" });
  }
});

function buildDeterministicCampaign(
  project: { id?: string; name: string; audience?: string; offer?: string },
  objective: string,
  platforms: string[],
  durationDays: number
) {
  const slug = (project.id || project.name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const audience = project.audience || "Decision-makers, operators & high-intent buyers";
  const offer = project.offer || "Autonomous workflow & growth engine";

  return {
    name: `${project.name} — ${durationDays}-Day Revenue & Lead Engine`,
    positioning: `Position ${project.name} (${offer}) as the fastest, most verifiable path for ${audience} to achieve: ${objective}`,
    platforms,
    durationDays,
    angles: [
      {
        title: "The Hidden Cost of Manual Operations",
        hook: `Most ${audience.split(",")[0].toLowerCase()} lose 12+ hours every week to manual follow-ups — here is how ${project.name} fixes it in 15 minutes.`,
        format: "9:16 Split-Screen Proof Reel (45s)",
        cta: `Comment "SYSTEM" or tap the WhatsApp link to get the ${project.name} blueprint.`,
        conversionGoal: "High-intent WhatsApp & DM lead capture",
      },
      {
        title: "Live Walkthrough & Case Proof",
        hook: `Watch how we deployed ${offer} from scratch and started qualifying leads automatically.`,
        format: "9:16 Over-the-Shoulder Screen Demo (60s)",
        cta: `Book a 10-minute qualification call via the link in bio.`,
        conversionGoal: "Booked discovery & demo calls",
      },
      {
        title: "Objection Breaker: Speed vs. Complexity",
        hook: `"We tried automating this before and it broke." Here is why verifiable workflows change the game for ${audience}.`,
        format: "9:16 Founder Direct-to-Camera + Kinetic Captions (35s)",
        cta: `Send "AUDIT" on WhatsApp for a free workflow readiness check.`,
        conversionGoal: "Qualified pipeline conversation",
      },
      {
        title: "ROI & Time-to-Value Breakdown",
        hook: `3 metrics every operator in Nigeria & across Africa should track before scaling ${offer.toLowerCase()}.`,
        format: "9:16 Carousel / Kinetic Data Storyboard (40s)",
        cta: `Download the checklist & scorecard from the link below.`,
        conversionGoal: "Lead magnet opt-in + CRM tag",
      },
      {
        title: "Behind the Scenes: Day-in-the-Life with Automation",
        hook: `What happens in the 60 seconds after a prospect messages ${project.name}? Full breakdown.`,
        format: "9:16 Fast-Paced Architecture Flow (30s)",
        cta: `Reply "DEMO" to test the live interactive flow yourself.`,
        conversionGoal: "Interactive product trial",
      },
      {
        title: "Direct Offer & Limited Implementation Cohort",
        hook: `We are onboarding 5 organizations this month for hands-on ${offer} deployment.`,
        format: "9:16 Executive Invitation (45s)",
        cta: `Apply now via the tracked link — takes 90 seconds.`,
        conversionGoal: "Direct commercial application",
      },
    ],
    weeklyPlan: [
      { week: 1, focus: "Problem Awareness & Bottleneck Diagnosis", posts: 7 },
      { week: 2, focus: "Live Product Proof & Workflow Demonstrations", posts: 7 },
      { week: 3, focus: "Objection Handling, Comparisons & Trust Signals", posts: 8 },
      { week: 4, focus: "Direct Conversion Push & Onboarding Scarcity", posts: 8 },
    ],
    leadPath: ["Short-Form Hook", "Tracked WhatsApp / Landing Page", "Automated Qualification Rubric", "Booked Call / Offer Close"],
    tracking: {
      campaignIdPattern: `gf_${slug}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      events: ["view", "click", "lead", "qualified", "sale"],
    },
  };
}

growthRouter.post("/campaign", async (req, res) => {
  const { project, objective, platforms = ["facebook", "instagram", "tiktok"], durationDays = 30 } = req.body || {};
  if (!project?.name || !objective) {
    return res.status(400).json({ error: "project and objective are required" });
  }

  const prompt = `You are the Growth Director inside an internal revenue engine.
Create a practical short-form campaign blueprint for:
PROJECT: ${project.name}
AUDIENCE: ${project.audience}
OFFER: ${project.offer}
OBJECTIVE: ${objective}
PLATFORMS: ${platforms.join(", ")}
DURATION: ${durationDays} days

Return ONLY valid JSON:
{"name":"...","positioning":"...","angles":[{"title":"...","hook":"...","format":"...","cta":"...","conversionGoal":"..."}],"weeklyPlan":[{"week":1,"focus":"...","posts":7}],"leadPath":["content","conversation","qualification","offer"],"tracking":{"campaignIdPattern":"...","events":["view","click","lead","qualified","sale"]}}
Make hooks specific, non-generic and suitable for Nigerian/African audiences where relevant. Do not promise guaranteed income.`;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey && apiKey !== "PROTECTED_SANDBOX_STUB") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
      const raw = response.text?.trim() || "";
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const campaign = JSON.parse(cleaned);
      if (campaign && Array.isArray(campaign.angles) && campaign.angles.length > 0) {
        return res.json({ success: true, campaign, generatedAt: new Date().toISOString(), engine: "gemini-2.5-flash" });
      }
    } catch (e: any) {
      console.warn("[GrowthFactory] Gemini fallback:", e?.message);
    }
  }

  if (isAgentRouterConfigured()) {
    try {
      const routed = await agentRouterChat({
        system: "Return strict JSON only. No markdown code fences.",
        user: prompt,
        temperature: 0.3,
      });
      const cleaned = routed.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const campaign = JSON.parse(cleaned);
      if (campaign && Array.isArray(campaign.angles) && campaign.angles.length > 0) {
        return res.json({ success: true, campaign, generatedAt: new Date().toISOString(), engine: "agentrouter" });
      }
    } catch (e: any) {
      console.warn("[GrowthFactory] AgentRouter fallback:", e?.message);
    }
  }

  const fallbackCampaign = buildDeterministicCampaign(project, objective, platforms, Number(durationDays) || 30);
  return res.json({
    success: true,
    campaign: fallbackCampaign,
    generatedAt: new Date().toISOString(),
    engine: "agentstation-growth-synthesizer",
  });
});

growthRouter.post("/render", async (req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.status(503).json({ error: "MONEYPRINTERTURBO_URL is not configured" });
  const { subject, script = "", language = "", campaignId = "", voiceName = "" } = req.body || {};
  if (!subject) return res.status(400).json({ error: "subject is required" });
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
    const headers: any = { "Content-Type": "application/json" };
    if (process.env.MONEYPRINTERTURBO_API_KEY) headers["Authorization"] = `Bearer ${process.env.MONEYPRINTERTURBO_API_KEY}`;
    const r = await fetch(base + "/api/v1/videos", { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "MoneyPrinterTurbo rejected render job", status: r.status, details: data });
    res.json({ success: true, provider: "moneyprinterturbo", campaignId, task: data?.data?.task_id || data?.task_id || null, raw: data });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || "MoneyPrinterTurbo render request failed" });
  }
});

growthRouter.get("/render/:taskId", async (req, res) => {
  const base = (process.env.MONEYPRINTERTURBO_URL || "").replace(/\/$/, "");
  if (!base) return res.status(503).json({ error: "MONEYPRINTERTURBO_URL is not configured" });
  try {
    const headers: any = {};
    if (process.env.MONEYPRINTERTURBO_API_KEY) headers["Authorization"] = `Bearer ${process.env.MONEYPRINTERTURBO_API_KEY}`;
    const r = await fetch(base + "/api/v1/tasks/" + encodeURIComponent(req.params.taskId), { headers, signal: AbortSignal.timeout(5000) });
    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 502).json(data);
  } catch (e: any) {
    res.status(502).json({ error: e?.message || "MoneyPrinterTurbo task lookup failed" });
  }
});
