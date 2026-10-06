import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Clock3,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react';

type Goal = {
  id: string;
  name: string;
  objective: string;
  intervalMinutes: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  autoApproveSafeTools: boolean;
  provider?: 'gemini' | 'ollama' | 'agentrouter';
  model?: string;
  nextRunAt: string;
  lastRunAt?: string;
  lastJobId?: string;
  consecutiveFailures: number;
};

type Runtime = {
  enabled: boolean;
  running: boolean;
  activeGoals: number;
  runningJobs: number;
  maxConcurrency: number;
  heartbeatAt: string;
};

type ObjectiveTemplateMeta = {
  id: string;
  name: string;
  category: 'revenue' | 'marketing' | 'operations' | 'engineering';
  description: string;
  outcome: string;
  inputs: string[];
  taskCount: number;
};

type AgentDef = {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  maxConcurrency: number;
  enabled: boolean;
};

type AgentTaskRecord = {
  id: string;
  agentId: string;
  objective: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: { text?: string; provider?: string; model?: string };
  error?: string;
  createdAt: string;
};

const DEFAULT_TEMPLATE_VALUES: Record<string, Record<string, string>> = {
  'lead-generation-engine': {
    offer: 'AI Workflow Automation & Custom Agent Deployment',
    idealCustomer: 'High-growth logistics, real estate, and fintech operators',
    market: 'Lagos & Abuja, Nigeria',
    leadCount: '20',
  },
  'appointment-setting-engine': {
    offer: 'NSOS School Operating System & CBT Suite',
    targetMarket: 'Private secondary school proprietors in Lagos',
    meetingType: '15-minute live system demo',
    capacity: '15 calls/week',
  },
  'business-automation-audit': {
    businessType: 'Multi-branch commercial real estate & facility management firm',
    workflowDescription: 'Lead capture from WhatsApp, manual Excel tracking, invoice follow-ups, and vendor dispatch',
    tools: 'AgentStation, WhatsApp Business API, PostgreSQL, Slack',
  },
  'competitor-intelligence': {
    company: 'Samura Property Intelligence',
    market: 'Nigerian Proptech & Real Estate Advisory',
    competitors: 'Estate Intel, BuyLetLive, PropertyPro NG',
  },
  'content-campaign-engine': {
    offer: 'Operra Business Operating System',
    audience: 'Founders, COOs, and agency operators',
    platforms: 'LinkedIn, Instagram Reels, YouTube Shorts, TikTok',
    campaignGoal: '50 qualified inbound discovery calls in 30 days',
  },
  'software-build-sprint': {
    feature: 'Multi-tenant role-based approval gate with webhook audit log',
    stack: 'TypeScript, React 19, Express, PostgreSQL, PyTest',
    constraints: 'Zero-downtime migration and sub-200ms API latency',
  },
  'production-incident-response': {
    incident: 'Elevated 502 timeouts on webhook ingestion worker during peak traffic',
    environment: 'Production Cluster (Node 20 + Neon Serverless Postgres)',
    recentChanges: 'Deployed parallel multi-agent dispatch queue v2.4',
  },
};

export function AutonomyCommandCenter({
  isOpen,
  onClose,
  onToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'goals' | 'templates' | 'fabric'>('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningGoalId, setRunningGoalId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    objective: '',
    intervalMinutes: 60,
    autoApproveSafeTools: true,
  });

  // Templates & Multi-Agent Fabric state
  const [templates, setTemplates] = useState<ObjectiveTemplateMeta[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('lead-generation-engine');
  const [templateVars, setTemplateVars] = useState<Record<string, string>>(
    DEFAULT_TEMPLATE_VALUES['lead-generation-engine']
  );
  const [dispatchingTemplate, setDispatchingTemplate] = useState(false);

  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTaskRecord[]>([]);
  const [customAgentId, setCustomAgentId] = useState('researcher');
  const [customAgentObjective, setCustomAgentObjective] = useState('');
  const [dispatchingCustom, setDispatchingCustom] = useState(false);

  const load = async () => {
    try {
      const [gRes, sRes, tRes, aRes, tasksRes] = await Promise.all([
        fetch('/api/autonomy/goals'),
        fetch('/api/autonomy/status'),
        fetch('/api/objectives/templates'),
        fetch('/api/agents'),
        fetch('/api/agents/tasks'),
      ]);
      const [gd, sd, td, ad, tasksData] = await Promise.all([
        gRes.json().catch(() => ({})),
        sRes.json().catch(() => ({})),
        tRes.json().catch(() => ({})),
        aRes.json().catch(() => ({})),
        tasksRes.json().catch(() => ({})),
      ]);

      if (gd.success) setGoals(gd.goals || []);
      if (sd.success) setRuntime(sd.status || sd);
      if (td.success && Array.isArray(td.templates)) setTemplates(td.templates);
      if (ad.success && Array.isArray(ad.agents)) setAgents(ad.agents);
      if (tasksData.success && Array.isArray(tasksData.tasks)) setAgentTasks(tasksData.tasks);
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [isOpen]);

  const active = useMemo(() => goals.filter((g) => g.status === 'active').length, [goals]);
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId]
  );

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    setTemplateVars(DEFAULT_TEMPLATE_VALUES[id] || {});
  };

  const create = async () => {
    if (!draft.name.trim() || !draft.objective.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/autonomy/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const d = await r.json();
      if (d.success) {
        setGoals((g) => [d.goal, ...g]);
        setDraft({ name: '', objective: '', intervalMinutes: 60, autoApproveSafeTools: true });
        onToast?.('Autonomous 24/7 goal created and scheduled.');
      }
    } finally {
      setLoading(false);
    }
  };

  const patch = async (id: string, status: 'active' | 'paused') => {
    const r = await fetch('/api/autonomy/goals/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const d = await r.json();
    if (d.success) {
      setGoals((g) => g.map((x) => (x.id === id ? d.goal : x)));
      onToast?.(`Goal ${status === 'active' ? 'resumed' : 'paused'}.`);
    }
  };

  const runGoalNow = async (id: string) => {
    setRunningGoalId(id);
    try {
      const r = await fetch(`/api/autonomy/goals/${id}/run`, { method: 'POST' });
      const d = await r.json();
      if (d.success && d.goal) {
        setGoals((g) => g.map((x) => (x.id === id ? d.goal : x)));
        onToast?.(`Executed autonomous goal "${d.goal.name}" immediately.`);
      }
    } finally {
      setRunningGoalId(null);
    }
  };

  const remove = async (id: string) => {
    await fetch('/api/autonomy/goals/' + id, { method: 'DELETE' });
    setGoals((g) => g.filter((x) => x.id !== id));
    onToast?.('Autonomous goal removed.');
  };

  const handleDispatchTemplate = async () => {
    if (!selectedTemplate) return;
    setDispatchingTemplate(true);
    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variables: templateVars,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast?.(
          `Dispatched ${data.count || selectedTemplate.taskCount} parallel specialist agents for "${selectedTemplate.name}"!`
        );
        await load();
        setActiveTab('fabric');
      } else {
        onToast?.(data.error || 'Template dispatch failed');
      }
    } catch (err: any) {
      onToast?.(err.message || 'Dispatch error');
    } finally {
      setDispatchingTemplate(false);
    }
  };

  const handleDispatchCustomAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAgentObjective.trim()) return;
    setDispatchingCustom(true);
    try {
      const res = await fetch('/api/agents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: [{ agentId: customAgentId, objective: customAgentObjective.trim() }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomAgentObjective('');
        onToast?.(`Dispatched specialist agent (${customAgentId})!`);
        await load();
      }
    } finally {
      setDispatchingCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
      <div className="w-full lg:max-w-5xl h-[94vh] lg:h-[88vh] rounded-t-3xl lg:rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Modal Header */}
        <header className="px-4 lg:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base">Autonomy & Multi-Agent Command Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {runtime?.enabled ? "RUNTIME ENABLED" : "RUNTIME STANDBY"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Recurring goals • objective templates • bounded specialist dispatch
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Refresh telemetry"
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close Autonomy Command Center"
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 px-4 lg:px-6 py-3 border-b border-slate-800 bg-slate-950/90 shrink-0">
          {[
            ['Autonomy Engine', runtime?.enabled ? (runtime.running ? 'RUNNING' : 'READY') : 'STANDBY', 'emerald', Activity],
            ['Active 24/7 Goals', String(runtime?.activeGoals ?? active), 'blue', Bot],
            ['Fabric Agent Tasks', String(agentTasks.length), 'cyan', Layers],
            [
              'Worker Capacity',
              runtime ? `${runtime.runningJobs ?? 0}/${runtime.maxConcurrency ?? 2} slots` : '0/2 slots',
              'violet',
              ShieldCheck,
            ],
          ].map(([label, value, tone, Icon]: any) => (
            <div key={label} className="rounded-xl border border-slate-800/90 bg-slate-900/60 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
              </div>
              <div
                className={
                  'mt-1 text-sm font-bold font-mono ' +
                  ({
                    emerald: 'text-emerald-400',
                    amber: 'text-amber-400',
                    blue: 'text-blue-400',
                    cyan: 'text-cyan-400',
                    violet: 'text-violet-400',
                  } as Record<string, string>)[tone]
                }
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs (Jakob's Law: clear segmented sub-navigation) */}
        <div className="px-4 lg:px-6 pt-2.5 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'goals'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>1. 24/7 Scheduled Goals ({goals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Objective Templates ({templates.length || 7})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fabric')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'fabric'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Parallel Multi-Agent Fabric ({agentTasks.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 scrollbar-thin">
          {/* TAB 1: 24/7 AUTONOMOUS GOALS */}
          {activeTab === 'goals' && (
            <>
              <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Create Recurring Autonomous Objective</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Runs automatically on schedule</span>
                </div>
                <div className="grid lg:grid-cols-[1fr_2fr_140px] gap-2.5">
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Goal name (e.g. Lagos PropTech Lead Scanner)"
                    className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <input
                    value={draft.objective}
                    onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
                    placeholder="What should AgentStation continuously execute and verify?"
                    className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <select
                    value={draft.intervalMinutes}
                    onChange={(e) => setDraft({ ...draft, intervalMinutes: Number(e.target.value) })}
                    className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs sm:text-sm text-white"
                  >
                    <option value={15}>Every 15m</option>
                    <option value={30}>Every 30m</option>
                    <option value={60}>Hourly</option>
                    <option value={360}>Every 6h</option>
                    <option value={1440}>Daily</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.autoApproveSafeTools}
                      onChange={(e) => setDraft({ ...draft, autoApproveSafeTools: e.target.checked })}
                    />
                    <span>Auto-approve governed low/medium-risk sandbox tools</span>
                  </label>
                  <button
                    disabled={loading || !draft.name.trim() || !draft.objective.trim()}
                    onClick={create}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                  >
                    {loading ? 'Scheduling...' : 'Start Autonomous Loop'}
                  </button>
                </div>
              </section>

              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Active & Scheduled Autonomous Workforce</h3>
                  <span className="text-xs font-mono text-slate-400">{goals.length} goals configured</span>
                </div>
                {goals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">
                      No recurring autonomous objectives yet. Create one above or seed a quick monitor below:
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          name: 'Daily Nigerian Real Estate & FX Yield Monitor',
                          objective:
                            'Scan Lagos & Abuja commercial real estate yields, hedge USD/NGN rate shifts, and update the investor intelligence brief.',
                          intervalMinutes: 360,
                          autoApproveSafeTools: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-semibold transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pre-fill Sample Lagos Real Estate Monitor</span>
                    </button>
                  </div>
                ) : (
                  goals.map((g) => (
                    <article
                      key={g.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={
                            'mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ' +
                            (g.status === 'active'
                              ? 'bg-emerald-400 animate-pulse'
                              : g.status === 'failed'
                              ? 'bg-red-400'
                              : 'bg-slate-600')
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{g.name}</h4>
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {g.status}
                            </span>
                            {g.autoApproveSafeTools && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                safe auto-approve
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{g.objective}</p>
                          <div className="mt-2.5 flex flex-wrap gap-3 text-[11px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock3 className="w-3 h-3" />
                              Every {g.intervalMinutes}m
                            </span>
                            <span>Next: {new Date(g.nextRunAt).toLocaleTimeString()}</span>
                            {g.lastRunAt && <span>Last run: {new Date(g.lastRunAt).toLocaleTimeString()}</span>}
                            <span>Failures: {g.consecutiveFailures}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => runGoalNow(g.id)}
                          disabled={runningGoalId === g.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{runningGoalId === g.id ? 'Running...' : 'Run Now'}</span>
                        </button>
                        {g.status === 'active' ? (
                          <button
                            onClick={() => patch(g.id, 'paused')}
                            title="Pause schedule"
                            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => patch(g.id, 'active')}
                            title="Resume schedule"
                            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(g.id)}
                          title="Delete goal"
                          className="p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>
            </>
          )}

          {/* TAB 2: OBJECTIVE TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="grid lg:grid-cols-[280px_1fr] gap-5">
              {/* Left Template Selector */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
                  Institutional Blueprints ({templates.length})
                </div>
                <div className="space-y-1.5">
                  {templates.map((t) => {
                    const isSelected = t.id === selectedTemplate?.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t.id)}
                        className={`w-full text-left p-3 rounded-xl border transition ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{t.name}</span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{t.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Template Variable Configurator & Dispatcher */}
              {selectedTemplate && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base font-bold text-white">{selectedTemplate.name}</h3>
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
                        {selectedTemplate.taskCount} Parallel Specialist Agents
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{selectedTemplate.description}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-1.5">
                      ✓ Target Outcome: {selectedTemplate.outcome}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Template Parameters
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedTemplate.inputs.map((inputKey) => (
                        <div key={inputKey} className="space-y-1">
                          <label className="text-xs font-mono text-slate-300 capitalize">
                            {inputKey.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={templateVars[inputKey] ?? ''}
                            onChange={(e) =>
                              setTemplateVars((prev) => ({ ...prev, [inputKey]: e.target.value }))
                            }
                            placeholder={`Enter ${inputKey}...`}
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Dispatches Researcher, Architect, QA, and Documenter in parallel.
                    </span>
                    <button
                      type="button"
                      disabled={dispatchingTemplate}
                      onClick={handleDispatchTemplate}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {dispatchingTemplate
                          ? 'Dispatching Specialist Agents...'
                          : `Dispatch ${selectedTemplate.taskCount}-Agent Sprint`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PARALLEL MULTI-AGENT FABRIC */}
          {activeTab === 'fabric' && (
            <div className="space-y-5">
              {/* Custom Single/Parallel Agent Dispatch Bar */}
              <form
                onSubmit={handleDispatchCustomAgent}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>Direct Specialist Agent Dispatch</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {agents.length} Specialist Personas Online
                  </span>
                </div>

                <div className="grid sm:grid-cols-[200px_1fr_auto] gap-2.5">
                  <select
                    value={customAgentId}
                    onChange={(e) => setCustomAgentId(e.target.value)}
                    className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customAgentObjective}
                    onChange={(e) => setCustomAgentObjective(e.target.value)}
                    placeholder="Assign a direct task to this specialist (e.g. Threat-model our webhook ingestion endpoint)..."
                    className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={dispatchingCustom || !customAgentObjective.trim()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{dispatchingCustom ? 'Running...' : 'Dispatch'}</span>
                  </button>
                </div>
              </form>

              {/* Agent Task Execution Feed */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Specialist Fabric Execution Ledger</h3>
                  <span className="text-xs font-mono text-slate-400">{agentTasks.length} tasks recorded</span>
                </div>

                {agentTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
                    No specialist agent tasks dispatched yet. Launch an Objective Template in Tab 2 or dispatch a specialist above!
                  </div>
                ) : (
                  agentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase">
                            {task.agentId}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{task.id}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : task.status === 'failed'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 font-medium">{task.objective}</p>

                      {task.result?.text && (
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {task.result.text}
                        </pre>
                      )}
                      {task.error && (
                        <div className="text-xs text-red-400 font-mono">{task.error}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
