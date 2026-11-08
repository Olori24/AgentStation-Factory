import { AgentProfile, AgentRole } from '../types';

/* ------------------------------------------------------------------ */
/* Agent creation model                                                */
/*                                                                     */
/* Plain-language presets, field metadata and validation for the       */
/* guided "New agent" flow. Everything here is presentation + config   */
/* only: it maps onto the existing AgentProfile shape so no existing   */
/* capability, API contract or agent behaviour changes.                */
/* ------------------------------------------------------------------ */

export type AgentTone = 'precise' | 'friendly' | 'bold' | 'formal';
export type AgentAutonomy = 'ask' | 'balanced' | 'autonomous';
export type AgentMemory = 'none' | 'session' | 'long-term';
export type AgentSchedule = 'manual' | 'hourly' | 'daily' | 'weekly';

export interface AgentLimits {
  maxSteps: number;
  timeoutSec: number;
  maxConcurrency: number;
}

/** The editable draft a user fills in across the guided flow. */
export interface AgentDraft {
  /* Step 1 — what it should do (essential) */
  presetId: string;
  name: string;
  roleTitle: string;
  goal: string;
  /* Step 2 — how it should behave */
  tone: AgentTone;
  autonomy: AgentAutonomy;
  /* Step 2 — advanced */
  model: string;
  temperature: number;
  systemPrompt: string;
  /* Step 3 — what it can access */
  capabilities: string[];
  tools: string[];
  /* Step 3 — advanced */
  memory: AgentMemory;
  limits: AgentLimits;
  schedule: AgentSchedule;
}

export interface AgentPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: 'search' | 'send' | 'headset' | 'chart' | 'sparkles';
  accent: string;
  role: AgentRole;
  roleTitle: string;
  badge: string;
  specialty: string;
  goal: string;
  tone: AgentTone;
  autonomy: AgentAutonomy;
  model: string;
  temperature: number;
  systemPrompt: string;
  capabilities: string[];
  tools: string[];
  memory: AgentMemory;
  limits: AgentLimits;
  schedule: AgentSchedule;
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'research',
    name: 'Research & Intelligence',
    tagline: 'Finds and verifies information',
    description:
      'Scans the web, gathers evidence and turns it into a clear, sourced brief. Great for market scans, competitor checks and lead sourcing.',
    icon: 'search',
    accent: '#06b6d4',
    role: 'researcher',
    roleTitle: 'Market Research Specialist',
    badge: 'Research & Synthesis',
    specialty: 'Web research, competitor intelligence, sourced briefs',
    goal: 'Research a topic and return a short, sourced brief with the key findings and next steps.',
    tone: 'precise',
    autonomy: 'balanced',
    model: 'Gemini 2.5 Flash',
    temperature: 0.4,
    systemPrompt:
      'You are a research specialist. Investigate the assigned objective, separate verified evidence from assumptions, cite your sources, and return a concise, actionable brief.',
    capabilities: ['web_research', 'synthesis', 'market_intelligence'],
    tools: ['web_search', 'web_browse_scrape', 'document_generator'],
    memory: 'long-term',
    limits: { maxSteps: 12, timeoutSec: 60, maxConcurrency: 2 },
    schedule: 'manual',
  },
  {
    id: 'outreach',
    name: 'Outreach & Sales',
    tagline: 'Writes and sequences outreach',
    description:
      'Drafts personalised, non-spammy outreach and multi-touch follow-up sequences for a target list. Great for prospecting and partnerships.',
    icon: 'send',
    accent: '#f97316',
    role: 'operations',
    roleTitle: 'Outbound Outreach Specialist',
    badge: 'Campaigns & Partnerships',
    specialty: 'Personalised outreach, multi-touch cadences, CTAs',
    goal: 'Turn a target list into a short, personalised outreach sequence with a clear call to action.',
    tone: 'friendly',
    autonomy: 'balanced',
    model: 'Gemini 2.5 Flash',
    temperature: 0.7,
    systemPrompt:
      'You are an outreach specialist. Write short, specific, honest messages tailored to each recipient. Never invent facts or metrics, and always include one clear call to action.',
    capabilities: ['personalized_outreach', 'cadence_design', 'cta_formulation'],
    tools: ['outreach_campaign_builder', 'document_generator'],
    memory: 'long-term',
    limits: { maxSteps: 10, timeoutSec: 45, maxConcurrency: 2 },
    schedule: 'manual',
  },
  {
    id: 'support',
    name: 'Customer Support',
    tagline: 'Answers and triages questions',
    description:
      'Answers common questions from your own material, triages incoming requests and escalates anything it is unsure about.',
    icon: 'headset',
    accent: '#6366f1',
    role: 'admin',
    roleTitle: 'Customer Support Specialist',
    badge: 'Support & Triage',
    specialty: 'Question answering, triage, escalation',
    goal: 'Answer customer questions accurately from approved material and escalate anything uncertain.',
    tone: 'friendly',
    autonomy: 'ask',
    model: 'Gemini 2.5 Flash',
    temperature: 0.3,
    systemPrompt:
      'You are a customer support specialist. Answer only from approved material, be concise and kind, and escalate to a human whenever you are unsure or the request is sensitive.',
    capabilities: ['ticket_triage', 'faq_answering', 'escalation'],
    tools: ['document_generator', 'file_read'],
    memory: 'session',
    limits: { maxSteps: 8, timeoutSec: 30, maxConcurrency: 2 },
    schedule: 'manual',
  },
  {
    id: 'analyst',
    name: 'Data & Reporting',
    tagline: 'Turns data into clean reports',
    description:
      'Cleans messy data into typed tables, computes the numbers and produces a summary you can act on. Great for KPIs and lead lists.',
    icon: 'chart',
    accent: '#14b8a6',
    role: 'data_analyst',
    roleTitle: 'Data Analyst',
    badge: 'Spreadsheets & Datasets',
    specialty: 'Data normalisation, KPI reporting, CSV/Excel export',
    goal: 'Turn raw data into a clean, typed table with the key numbers summarised.',
    tone: 'precise',
    autonomy: 'balanced',
    model: 'Gemini 2.5 Flash',
    temperature: 0.2,
    systemPrompt:
      'You are a data analyst. Normalise the supplied data into a clean, typed table, compute the requested metrics, and never fabricate values that are not present in the source.',
    capabilities: ['data_normalization', 'kpi_reporting', 'csv_export'],
    tools: ['spreadsheet_builder', 'data_exporter'],
    memory: 'session',
    limits: { maxSteps: 10, timeoutSec: 45, maxConcurrency: 2 },
    schedule: 'manual',
  },
  {
    id: 'custom',
    name: 'Start from scratch',
    tagline: 'Configure everything yourself',
    description:
      'Begin with sensible defaults and describe exactly what you want. You can refine every setting later.',
    icon: 'sparkles',
    accent: '#8b5cf6',
    role: 'researcher',
    roleTitle: 'Custom Specialist',
    badge: 'Custom Agent',
    specialty: 'General purpose',
    goal: '',
    tone: 'precise',
    autonomy: 'balanced',
    model: 'Gemini 2.5 Flash',
    temperature: 0.4,
    systemPrompt: '',
    capabilities: [],
    tools: [],
    memory: 'session',
    limits: { maxSteps: 10, timeoutSec: 45, maxConcurrency: 2 },
    schedule: 'manual',
  },
];

export function getPreset(id: string): AgentPreset {
  return AGENT_PRESETS.find((p) => p.id === id) || AGENT_PRESETS[AGENT_PRESETS.length - 1];
}

/* ------------------------------------------------------------------ */
/* Plain-language option metadata (labels + "when to change it" help)  */
/* ------------------------------------------------------------------ */

export interface OptionMeta<T extends string = string> {
  value: T;
  label: string;
  help: string;
}

export const TONE_OPTIONS: OptionMeta<AgentTone>[] = [
  { value: 'precise', label: 'Precise', help: 'Short, factual, no fluff. Best for research and analysis.' },
  { value: 'friendly', label: 'Friendly', help: 'Warm and conversational. Best for outreach and support.' },
  { value: 'bold', label: 'Bold', help: 'Punchy and confident. Best for marketing and pitches.' },
  { value: 'formal', label: 'Formal', help: 'Polished and corporate. Best for reports and legal-adjacent work.' },
];

export const AUTONOMY_OPTIONS: OptionMeta<AgentAutonomy>[] = [
  { value: 'ask', label: 'Ask me first', help: 'The agent pauses for your approval before taking any action.' },
  { value: 'balanced', label: 'Balanced', help: 'Acts on routine steps, asks before anything risky or irreversible.' },
  { value: 'autonomous', label: 'Fully autonomous', help: 'Runs end-to-end without stopping. Use for trusted, repeatable work.' },
];

export const MEMORY_OPTIONS: OptionMeta<AgentMemory>[] = [
  { value: 'none', label: 'No memory', help: 'Each run starts fresh. Best for one-off, independent tasks.' },
  { value: 'session', label: 'Within a task', help: 'Remembers context during a single task, then forgets it.' },
  { value: 'long-term', label: 'Across tasks', help: 'Remembers past work to improve future runs. Best for ongoing relationships.' },
];

export const SCHEDULE_OPTIONS: OptionMeta<AgentSchedule>[] = [
  { value: 'manual', label: 'Only when I ask', help: 'The agent runs when you start it. The safest default.' },
  { value: 'hourly', label: 'Every hour', help: 'Runs automatically each hour. Best for monitoring.' },
  { value: 'daily', label: 'Every day', help: 'Runs once a day. Best for daily digests and reports.' },
  { value: 'weekly', label: 'Every week', help: 'Runs once a week. Best for weekly summaries.' },
];

export const MODEL_OPTIONS: OptionMeta[] = [
  { value: 'Gemini 2.5 Flash', label: 'Gemini 2.5 Flash', help: 'Fast and capable. The right choice for almost every agent.' },
  { value: 'Gemini 2.5 Pro', label: 'Gemini 2.5 Pro', help: 'Slower but stronger reasoning. Use for complex analysis.' },
  { value: 'Local Ollama', label: 'Local Ollama', help: 'Runs on your own machine. Use when data must not leave your network.' },
];

export interface ToolMeta {
  value: string;
  label: string;
  help: string;
}

export const TOOL_OPTIONS: ToolMeta[] = [
  { value: 'web_search', label: 'Web search', help: 'Look things up on the public web.' },
  { value: 'web_browse_scrape', label: 'Browse & read pages', help: 'Open a page and read its content.' },
  { value: 'document_generator', label: 'Write documents', help: 'Produce briefs, reports and memos.' },
  { value: 'spreadsheet_builder', label: 'Build spreadsheets', help: 'Create typed tables and datasets.' },
  { value: 'data_exporter', label: 'Export data', help: 'Save data as CSV or JSON.' },
  { value: 'outreach_campaign_builder', label: 'Build outreach', help: 'Draft email and LinkedIn sequences.' },
  { value: 'file_read', label: 'Read files', help: 'Read files already in the workspace.' },
  { value: 'file_write', label: 'Write files', help: 'Create and update files in the workspace.' },
];

export interface CapabilityMeta {
  value: string;
  label: string;
}

export const CAPABILITY_OPTIONS: CapabilityMeta[] = [
  { value: 'web_research', label: 'Web research' },
  { value: 'synthesis', label: 'Synthesis' },
  { value: 'market_intelligence', label: 'Market intelligence' },
  { value: 'personalized_outreach', label: 'Personalised outreach' },
  { value: 'cadence_design', label: 'Follow-up cadences' },
  { value: 'cta_formulation', label: 'Call-to-action writing' },
  { value: 'ticket_triage', label: 'Ticket triage' },
  { value: 'faq_answering', label: 'FAQ answering' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'data_normalization', label: 'Data normalisation' },
  { value: 'kpi_reporting', label: 'KPI reporting' },
  { value: 'csv_export', label: 'CSV export' },
];

/* ------------------------------------------------------------------ */
/* Draft helpers                                                       */
/* ------------------------------------------------------------------ */

export function createDraftFromPreset(presetId: string): AgentDraft {
  const p = getPreset(presetId);
  return {
    presetId: p.id,
    name: p.id === 'custom' ? '' : p.name,
    roleTitle: p.id === 'custom' ? '' : p.roleTitle,
    goal: p.goal,
    tone: p.tone,
    autonomy: p.autonomy,
    model: p.model,
    temperature: p.temperature,
    systemPrompt: p.systemPrompt,
    capabilities: [...p.capabilities],
    tools: [...p.tools],
    memory: p.memory,
    limits: { ...p.limits },
    schedule: p.schedule,
  };
}

export interface DraftErrors {
  name?: string;
  roleTitle?: string;
  goal?: string;
}

/** Validate only the fields on the primary path. Advanced fields always have safe defaults. */
export function validateDraft(draft: AgentDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Give your agent a name so you can find it later.';
  else if (name.length < 2) errors.name = 'Use at least 2 characters.';
  else if (name.length > 40) errors.name = 'Keep the name under 40 characters.';

  const roleTitle = draft.roleTitle.trim();
  if (!roleTitle) errors.roleTitle = 'Describe the role in a few words (e.g. "Market Research Specialist").';
  else if (roleTitle.length > 60) errors.roleTitle = 'Keep the role under 60 characters.';

  const goal = draft.goal.trim();
  if (!goal) errors.goal = 'Tell the agent what to do — one clear sentence is enough.';
  else if (goal.length < 10) errors.goal = 'Add a little more detail so the agent knows what success looks like.';
  else if (goal.length > 280) errors.goal = 'Keep the goal under 280 characters.';

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Map a completed draft onto the existing AgentProfile shape (no new required fields). */
export function draftToAgentProfile(draft: AgentDraft): AgentProfile {
  const preset = getPreset(draft.presetId);
  const slug = draft.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'agent';
  return {
    id: preset.role,
    key: `custom-${slug}-${Date.now().toString(36)}`,
    name: draft.name.trim(),
    roleTitle: draft.roleTitle.trim(),
    badge: preset.badge,
    specialty: draft.capabilities.length ? draft.capabilities.join(', ') : preset.specialty,
    model: draft.model,
    status: 'idle',
    color: preset.accent,
    custom: true,
    presetId: draft.presetId,
    tone: draft.tone,
    autonomy: draft.autonomy,
    goal: draft.goal.trim(),
    capabilities: [...draft.capabilities],
    tools: [...draft.tools],
    temperature: draft.temperature,
    memory: draft.memory,
    limits: { ...draft.limits },
    schedule: draft.schedule,
    systemPrompt: draft.systemPrompt.trim() || preset.systemPrompt || 'You are a specialist agent. Follow the assigned goal, use only approved tools, verify your work, and ask for clarification when requirements are ambiguous.',
    createdAt: new Date().toISOString(),
  };
}

/** Human-readable summary lines used by the review step and the agent detail view. */
export function summariseDraft(draft: AgentDraft): { label: string; value: string }[] {
  const preset = getPreset(draft.presetId);
  const tone = TONE_OPTIONS.find((o) => o.value === draft.tone)?.label || draft.tone;
  const autonomy = AUTONOMY_OPTIONS.find((o) => o.value === draft.autonomy)?.label || draft.autonomy;
  const memory = MEMORY_OPTIONS.find((o) => o.value === draft.memory)?.label || draft.memory;
  const schedule = SCHEDULE_OPTIONS.find((o) => o.value === draft.schedule)?.label || draft.schedule;
  const tools = draft.tools
    .map((t) => TOOL_OPTIONS.find((o) => o.value === t)?.label || t)
    .join(', ');
  return [
    { label: 'Name', value: draft.name.trim() || '—' },
    { label: 'Role', value: draft.roleTitle.trim() || '—' },
    { label: 'What it does', value: draft.goal.trim() || '—' },
    { label: 'Starting point', value: preset.name },
    { label: 'Style', value: tone },
    { label: 'How it works', value: autonomy },
    { label: 'Model', value: draft.model },
    { label: 'Can access', value: tools || 'Nothing yet' },
    { label: 'Remembers', value: memory },
    { label: 'Runs', value: schedule },
  ];
}
