import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  Headset,
  Loader2,
  Search,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { AgentProfile } from '../types';
import {
  AGENT_PRESETS,
  AgentDraft,
  AgentPreset,
  AUTONOMY_OPTIONS,
  CAPABILITY_OPTIONS,
  MEMORY_OPTIONS,
  MODEL_OPTIONS,
  SCHEDULE_OPTIONS,
  TONE_OPTIONS,
  TOOL_OPTIONS,
  createDraftFromPreset,
  draftToAgentProfile,
  hasErrors,
  summariseDraft,
  validateDraft,
} from '../data/agentPresets';
import {
  Badge,
  Button,
  Chip,
  Disclosure,
  Field,
  Modal,
  Segmented,
  TextArea,
  TextInput,
} from './ui';

/* ------------------------------------------------------------------ */
/* Guided agent creation — 4 short steps, progressive disclosure.      */
/* Essential fields first; advanced configuration stays collapsed.     */
/* ------------------------------------------------------------------ */

interface AgentCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (agent: AgentProfile) => void;
  /** Optional preset to open with (e.g. from a template card). */
  initialPresetId?: string;
}

const STEPS = [
  { id: 1, label: 'What it does', hint: 'Name, role and goal' },
  { id: 2, label: 'How it behaves', hint: 'Style and autonomy' },
  { id: 3, label: 'What it can access', hint: 'Tools and memory' },
  { id: 4, label: 'Review & create', hint: 'Confirm and launch' },
];

const PRESET_ICONS: Record<AgentPreset['icon'], React.ReactNode> = {
  search: <Search className="w-4 h-4" />,
  send: <Send className="w-4 h-4" />,
  headset: <Headset className="w-4 h-4" />,
  chart: <BarChart3 className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
};

export const AgentCreationFlow: React.FC<AgentCreationFlowProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialPresetId,
}) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AgentDraft>(() => createDraftFromPreset(initialPresetId || 'research'));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phase, setPhase] = useState<'form' | 'creating' | 'done'>('form');
  const [created, setCreated] = useState<AgentProfile | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Reset the flow each time it opens so a previous draft never leaks in.
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDraft(createDraftFromPreset(initialPresetId || 'research'));
      setTouched({});
      setShowAdvanced(false);
      setPhase('form');
      setCreated(null);
    }
  }, [isOpen, initialPresetId]);

  // Move focus to the first field when step 1 appears (keyboard-first flow).
  useEffect(() => {
    if (isOpen && phase === 'form' && step === 1) {
      const t = setTimeout(() => firstFieldRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen, phase, step]);

  const errors = useMemo(() => validateDraft(draft), [draft]);
  const step1Valid = !hasErrors(errors);

  const update = <K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (presetId: string) => {
    setDraft(createDraftFromPreset(presetId));
    setTouched({});
  };

  const toggleIn = (key: 'capabilities' | 'tools', value: string) =>
    setDraft((prev) => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const goNext = () => {
    if (step === 1) {
      setTouched({ name: true, roleTitle: true, goal: true });
      if (!step1Valid) return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleCreate = () => {
    setPhase('creating');
    // Small, honest delay so the confirmation feels deliberate rather than instant.
    setTimeout(() => {
      const agent = draftToAgentProfile(draft);
      setCreated(agent);
      setPhase('done');
      onCreated(agent);
    }, 550);
  };

  const summary = useMemo(() => summariseDraft(draft), [draft]);
  const preset = AGENT_PRESETS.find((p) => p.id === draft.presetId) || AGENT_PRESETS[0];

  /* ----------------------------- success ----------------------------- */
  if (phase === 'done' && created) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-lg"
        title="Agent created"
        subtitle="It is ready to take on work"
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        footer={
          <>
            <Button tone="ghost" onClick={onClose}>
              Close
            </Button>
            <Button tone="primary" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={onClose}>
              Go to my agents
            </Button>
          </>
        }
      >
        <div className="p-5 sm:p-6 space-y-4 as-scale-in">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${created.color}22`, color: created.color }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{created.name}</div>
              <div className="text-xs text-slate-400 truncate">{created.roleTitle}</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              What happens next
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Assign it a task from the Command Deck — it will follow the goal you set.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>You can refine its style, tools and limits at any time from My agents.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>It starts in “{created.schedule === 'manual' ? 'only when I ask' : created.schedule}” mode, so nothing runs on its own.</span>
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  /* ----------------------------- creating ---------------------------- */
  if (phase === 'creating') {
    return (
      <Modal isOpen={isOpen} onClose={() => {}} maxWidth="max-w-md" title="Creating your agent" icon={<Loader2 className="w-4 h-4 animate-spin text-blue-400" />}>
        <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-sm font-semibold text-slate-200">Setting up {draft.name.trim() || 'your agent'}…</p>
          <p className="text-xs text-slate-500">Applying your configuration and defaults.</p>
        </div>
      </Modal>
    );
  }

  /* ------------------------------- form ------------------------------ */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="New agent"
      subtitle={`Step ${step} of 4 · ${STEPS[step - 1].label}`}
      icon={<Wand2 className="w-4 h-4 text-blue-400" />}
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button tone="ghost" onClick={step === 1 ? onClose : goBack} icon={step === 1 ? undefined : <ArrowLeft className="w-3.5 h-3.5" />}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button tone="primary" onClick={goNext} icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Continue
            </Button>
          ) : (
            <Button tone="primary" onClick={handleCreate} icon={<Check className="w-3.5 h-3.5" />}>
              Create agent
            </Button>
          )}
        </div>
      }
    >
      {/* Progress indicator */}
      <div className="px-5 sm:px-6 pt-4">
        <ol className="flex items-center gap-1.5" aria-label="Creation progress">
          {STEPS.map((s) => {
            const state = s.id < step ? 'done' : s.id === step ? 'current' : 'todo';
            return (
              <li key={s.id} className="flex-1 min-w-0">
                <div
                  className={`h-1 rounded-full transition-all ${
                    state === 'done' ? 'bg-emerald-500' : state === 'current' ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                />
                <div className="mt-1.5 flex items-center gap-1">
                  {state === 'done' && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  <span
                    className={`text-[10px] font-medium truncate ${
                      state === 'current' ? 'text-slate-200' : state === 'done' ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* ------------------------- STEP 1 ------------------------- */}
        {step === 1 && (
          <div className="space-y-5 as-enter-fast">
            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2">Start from a template</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {AGENT_PRESETS.map((p) => {
                  const active = p.id === draft.presetId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      aria-pressed={active}
                      className={`as-focus-ring text-left rounded-xl border p-3 transition ${
                        active
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${p.accent}22`, color: p.accent }}
                        >
                          {PRESET_ICONS[p.icon]}
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate">{p.name}</span>
                        {active && <Check className="w-3.5 h-3.5 text-blue-400 ml-auto shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{p.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field
              label="Agent name"
              htmlFor="agent-name"
              required
              tooltip="A short label so you can find this agent later. It does not affect how it works."
              error={touched.name ? errors.name : undefined}
              hint="Something you will recognise at a glance."
            >
              <TextInput
                id="agent-name"
                ref={firstFieldRef}
                value={draft.name}
                invalid={Boolean(touched.name && errors.name)}
                placeholder="e.g. Lagos Property Scout"
                maxLength={40}
                onChange={(e) => update('name', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              />
            </Field>

            <Field
              label="Role"
              htmlFor="agent-role"
              required
              tooltip="The job title this agent plays. It shapes the language the agent uses."
              error={touched.roleTitle ? errors.roleTitle : undefined}
            >
              <TextInput
                id="agent-role"
                value={draft.roleTitle}
                invalid={Boolean(touched.roleTitle && errors.roleTitle)}
                placeholder="e.g. Market Research Specialist"
                maxLength={60}
                onChange={(e) => update('roleTitle', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, roleTitle: true }))}
              />
            </Field>

            <Field
              label="What should it do?"
              htmlFor="agent-goal"
              required
              tooltip="One clear sentence describing the outcome you want. This is the single most important field."
              error={touched.goal ? errors.goal : undefined}
              hint={`${draft.goal.trim().length}/280 characters`}
            >
              <TextArea
                id="agent-goal"
                rows={3}
                value={draft.goal}
                invalid={Boolean(touched.goal && errors.goal)}
                placeholder="e.g. Find 20 boutique property firms in Lagos and summarise their digital gaps."
                maxLength={280}
                onChange={(e) => update('goal', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, goal: true }))}
              />
            </Field>
          </div>
        )}

        {/* ------------------------- STEP 2 ------------------------- */}
        {step === 2 && (
          <div className="space-y-5 as-enter-fast">
            <Field
              label="How should it sound?"
              tooltip="The writing style the agent uses in everything it produces."
              hint="Pick the closest match — you can change this later."
            >
              <Segmented
                ariaLabel="Writing style"
                options={TONE_OPTIONS}
                value={draft.tone}
                onChange={(v) => update('tone', v as AgentDraft['tone'])}
              />
            </Field>

            <Field
              label="How much should it do on its own?"
              tooltip="Controls whether the agent pauses for your approval before acting."
              hint="“Ask me first” is the safest choice while you are getting to know an agent."
            >
              <Segmented
                ariaLabel="Autonomy"
                options={AUTONOMY_OPTIONS}
                value={draft.autonomy}
                onChange={(v) => update('autonomy', v as AgentDraft['autonomy'])}
              />
            </Field>

            <Disclosure
              title="Advanced behaviour"
              description="Model, creativity and the agent's instructions"
              open={showAdvanced}
              onToggle={() => setShowAdvanced((v) => !v)}
            >
              <Field
                label="Model"
                tooltip="The AI engine behind the agent. Flash is fast and capable; Pro reasons harder but is slower."
                hint="Leave this on Gemini 2.5 Flash unless you have a specific reason to change it."
              >
                <Segmented
                  ariaLabel="Model"
                  options={MODEL_OPTIONS}
                  value={draft.model}
                  onChange={(v) => update('model', v)}
                  columns={1}
                />
              </Field>

              <Field
                label={`Creativity — ${draft.temperature.toFixed(1)}`}
                tooltip="Lower is more consistent and factual; higher is more varied and creative."
                hint="0.2 for analysis and data, 0.7 for marketing and outreach."
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={draft.temperature}
                  aria-label="Creativity"
                  onChange={(e) => update('temperature', Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </Field>

              <Field
                label="Instructions"
                tooltip="The standing brief the agent follows on every run. Leave blank to use the template's instructions."
                hint="Optional. Only change this if you need behaviour the template does not cover."
              >
                <TextArea
                  rows={4}
                  value={draft.systemPrompt}
                  placeholder="Leave blank to use the recommended instructions for this template."
                  onChange={(e) => update('systemPrompt', e.target.value)}
                />
              </Field>
            </Disclosure>
          </div>
        )}

        {/* ------------------------- STEP 3 ------------------------- */}
        {step === 3 && (
          <div className="space-y-5 as-enter-fast">
            <Field
              label="What can it use?"
              tooltip="Tools are the actions the agent is allowed to take. Nothing is enabled unless you select it."
              hint="Selected tools are the only actions this agent can perform."
            >
              <div className="flex flex-wrap gap-1.5">
                {TOOL_OPTIONS.map((t) => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    help={t.help}
                    selected={draft.tools.includes(t.value)}
                    onClick={() => toggleIn('tools', t.value)}
                  />
                ))}
              </div>
            </Field>

            <Field
              label="Skills"
              tooltip="Skills describe what the agent is good at. They help it plan and are shown on its profile."
              hint="Optional — pick the ones that match the job."
            >
              <div className="flex flex-wrap gap-1.5">
                {CAPABILITY_OPTIONS.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    selected={draft.capabilities.includes(c.value)}
                    onClick={() => toggleIn('capabilities', c.value)}
                  />
                ))}
              </div>
            </Field>

            <Disclosure
              title="Advanced access & limits"
              description="Memory, run limits and scheduling"
              open={showAdvanced}
              onToggle={() => setShowAdvanced((v) => !v)}
            >
              <Field
                label="Memory"
                tooltip="Whether the agent remembers anything between runs."
                hint="“Across tasks” helps ongoing work; “No memory” keeps runs independent."
              >
                <Segmented
                  ariaLabel="Memory"
                  options={MEMORY_OPTIONS}
                  value={draft.memory}
                  onChange={(v) => update('memory', v as AgentDraft['memory'])}
                  columns={1}
                />
              </Field>

              <Field
                label="When should it run?"
                tooltip="Scheduled runs happen automatically. “Only when I ask” is the safe default."
                hint="Scheduled agents keep running until you turn them off."
              >
                <Segmented
                  ariaLabel="Schedule"
                  options={SCHEDULE_OPTIONS}
                  value={draft.schedule}
                  onChange={(v) => update('schedule', v as AgentDraft['schedule'])}
                  columns={2}
                />
              </Field>

              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Max steps" tooltip="The most steps a single run may take before it stops.">
                  <TextInput
                    type="number"
                    min={1}
                    max={50}
                    value={draft.limits.maxSteps}
                    onChange={(e) =>
                      update('limits', { ...draft.limits, maxSteps: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })
                    }
                  />
                </Field>
                <Field label="Timeout (s)" tooltip="How long a single run may take before it is stopped.">
                  <TextInput
                    type="number"
                    min={5}
                    max={600}
                    value={draft.limits.timeoutSec}
                    onChange={(e) =>
                      update('limits', { ...draft.limits, timeoutSec: Math.max(5, Math.min(600, Number(e.target.value) || 5)) })
                    }
                  />
                </Field>
                <Field label="Parallel runs" tooltip="How many runs of this agent may happen at the same time.">
                  <TextInput
                    type="number"
                    min={1}
                    max={8}
                    value={draft.limits.maxConcurrency}
                    onChange={(e) =>
                      update('limits', {
                        ...draft.limits,
                        maxConcurrency: Math.max(1, Math.min(8, Number(e.target.value) || 1)),
                      })
                    }
                  />
                </Field>
              </div>
            </Disclosure>
          </div>
        )}

        {/* ------------------------- STEP 4 ------------------------- */}
        {step === 4 && (
          <div className="space-y-4 as-enter-fast">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${preset.accent}22`, color: preset.accent }}
              >
                {PRESET_ICONS[preset.icon]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{draft.name.trim() || 'Untitled agent'}</div>
                <div className="text-xs text-slate-400 truncate">{draft.roleTitle.trim() || 'No role set'}</div>
              </div>
              <Badge tone="blue" className="ml-auto shrink-0">
                {preset.name}
              </Badge>
            </div>

            <dl className="rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/70">
              {summary.map((row) => (
                <div key={row.label} className="flex items-start gap-3 px-3.5 py-2.5">
                  <dt className="w-28 shrink-0 text-[11px] font-medium text-slate-500">{row.label}</dt>
                  <dd className="text-xs text-slate-200 leading-relaxed min-w-0 break-words">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-start gap-2 rounded-lg border border-blue-500/25 bg-blue-500/5 px-3 py-2.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nothing runs automatically yet. You can change any of these settings later from{' '}
                <span className="text-slate-200 font-medium">My agents</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
