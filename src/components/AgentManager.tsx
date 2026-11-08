import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Check,
  Headset,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { AgentProfile } from '../types';
import {
  AGENT_PRESETS,
  AUTONOMY_OPTIONS,
  MEMORY_OPTIONS,
  SCHEDULE_OPTIONS,
  TONE_OPTIONS,
  TOOL_OPTIONS,
} from '../data/agentPresets';
import { Badge, Button, Card, EmptyState, Modal, Tooltip } from './ui';

/* ------------------------------------------------------------------ */
/* My agents — a calm list of the squad plus any agents you create.    */
/* Reuses the shared design system; no new dependencies.               */
/* ------------------------------------------------------------------ */

interface AgentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentProfile[];
  onCreateAgent: () => void;
  onDeleteAgent?: (key: string) => void;
}

const PRESET_ICON: Record<string, React.ReactNode> = {
  search: <Search className="w-4 h-4" />,
  send: <Send className="w-4 h-4" />,
  headset: <Headset className="w-4 h-4" />,
  chart: <BarChart3 className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
};

function presetForAgent(agent: AgentProfile) {
  return (
    AGENT_PRESETS.find((p) => p.role === agent.id && p.id !== 'custom') ||
    AGENT_PRESETS.find((p) => p.id === 'custom')!
  );
}

/** Icon for an agent: preset icon for custom agents, a neutral bot for built-ins. */
function agentIcon(agent: AgentProfile): React.ReactNode {
  if (!agent.custom) return <Bot className="w-4 h-4" />;
  return PRESET_ICON[presetForAgent(agent).icon];
}

const STATUS_META: Record<AgentProfile['status'], { label: string; dot: string; text: string }> = {
  idle: { label: 'Idle', dot: 'bg-slate-500', text: 'text-slate-400' },
  working: { label: 'Working', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300' },
  completed: { label: 'Ready', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  error: { label: 'Needs attention', dot: 'bg-red-400', text: 'text-red-300' },
};

export const AgentManager: React.FC<AgentManagerProps> = ({
  isOpen,
  onClose,
  agents,
  onCreateAgent,
  onDeleteAgent,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.roleTitle.toLowerCase().includes(q) ||
        (a.goal || '').toLowerCase().includes(q)
    );
  }, [agents, query]);

  const selected = agents.find((a) => (a.key || a.id) === selectedKey) || null;
  const customCount = agents.filter((a) => a.custom).length;

  const closeAll = () => {
    setSelectedKey(null);
    setQuery('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAll}
      maxWidth="max-w-3xl"
      title={selected ? selected.name : 'My agents'}
      subtitle={
        selected
          ? selected.roleTitle
          : `${agents.length} agent${agents.length === 1 ? '' : 's'} · ${customCount} created by you`
      }
      icon={
        selected ? (
          <span style={{ color: selected.color }}>
            <Bot className="w-4 h-4" />
          </span>
        ) : (
          <Bot className="w-4 h-4 text-violet-400" />
        )
      }
      footer={
        selected ? (
          <div className="w-full flex items-center justify-between gap-2">
            <Button tone="ghost" onClick={() => setSelectedKey(null)} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              All agents
            </Button>
            {selected.custom && onDeleteAgent && (
              <Button
                tone="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  onDeleteAgent(selected.key || selected.id);
                  setSelectedKey(null);
                }}
              >
                Delete agent
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-2">
            <Button tone="ghost" onClick={closeAll}>
              Close
            </Button>
            <Button tone="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={onCreateAgent}>
              New agent
            </Button>
          </div>
        )
      }
    >
      {selected ? (
        <AgentDetail agent={selected} />
      ) : (
        <div className="p-5 sm:p-6 space-y-4">
          {/* Search + create */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agents…"
                aria-label="Search agents"
                className="w-full py-2 pl-8 pr-3 text-xs bg-slate-950/80 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <Button tone="primary" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={onCreateAgent}>
              New agent
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-4 h-4" />}
              title={query ? 'No agents match' : 'No agents yet'}
              description={
                query
                  ? 'Try a different search term.'
                  : 'Create your first agent and it will appear here, ready to take on work.'
              }
              action={
                !query ? (
                  <Button tone="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={onCreateAgent}>
                    Create an agent
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {filtered.map((agent) => {
                const status = STATUS_META[agent.status] || STATUS_META.idle;
                return (
                  <button
                    key={agent.key || agent.id}
                    type="button"
                    onClick={() => setSelectedKey(agent.key || agent.id)}
                    className="as-card as-card-interactive text-left rounded-xl border border-slate-800/90 bg-slate-900/60 p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
                      >
                        {agentIcon(agent)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-100 truncate">{agent.name}</span>
                          {agent.custom && (
                            <Badge tone="violet" className="shrink-0">
                              Yours
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{agent.roleTitle}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span className={`text-[10px] font-mono ${status.text}`}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    {agent.goal && (
                      <p className="text-[11px] text-slate-500 leading-snug mt-2.5 line-clamp-2">{agent.goal}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Detail view — plain-language configuration summary                  */
/* ------------------------------------------------------------------ */

const AgentDetail: React.FC<{ agent: AgentProfile }> = ({ agent }) => {
  const preset = presetForAgent(agent);
  const tone = TONE_OPTIONS.find((o) => o.value === (agent as any).tone)?.label;
  const memory = MEMORY_OPTIONS.find((o) => o.value === agent.memory)?.label;
  const schedule = SCHEDULE_OPTIONS.find((o) => o.value === agent.schedule)?.label;
  const tools = (agent.tools || [])
    .map((t) => TOOL_OPTIONS.find((o) => o.value === t)?.label || t)
    .join(', ');

  const rows: { label: string; value: string }[] = [
    { label: 'What it does', value: agent.goal || preset.goal || '—' },
    { label: 'Starting point', value: preset.name },
    { label: 'Model', value: agent.model },
    { label: 'Can access', value: tools || 'Nothing yet' },
    { label: 'Remembers', value: memory || 'Within a task' },
    { label: 'Runs', value: schedule || 'Only when I ask' },
  ];
  if (tone) rows.splice(3, 0, { label: 'Style', value: tone });

  return (
    <div className="p-5 sm:p-6 space-y-4 as-enter-fast">
      <div className="flex items-center gap-3">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
        >
          {agentIcon(agent)}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{agent.name}</div>
          <div className="text-xs text-slate-400 truncate">{agent.roleTitle}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {agent.custom ? <Badge tone="violet">Yours</Badge> : <Badge tone="blue">Built-in</Badge>}
        </div>
      </div>

      <dl className="rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/70">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 px-3.5 py-2.5">
            <dt className="w-28 shrink-0 text-[11px] font-medium text-slate-500">{row.label}</dt>
            <dd className="text-xs text-slate-200 leading-relaxed min-w-0 break-words">{row.value}</dd>
          </div>
        ))}
      </dl>

      {agent.capabilities && agent.capabilities.length > 0 && (
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-800 bg-slate-950/60 text-slate-300"
              >
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                {c.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {agent.systemPrompt && (
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Instructions
          </div>
          <Card padded={false} className="p-3">
            <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{agent.systemPrompt}</p>
          </Card>
        </div>
      )}

      {!agent.custom && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This is a built-in squad member. Create your own agent to customise the goal, tools and limits.
          </p>
        </div>
      )}
    </div>
  );
};
