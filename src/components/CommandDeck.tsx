import React from 'react';
import {
  Bot,
  CheckCircle2,
  Clock,
  FileCode,
  Film,
  GitBranch,
  History,
  Play,
  Plus,
  Sparkles,
  Terminal,
  AlertTriangle,
  ArrowRight,
  Activity,
  Cpu,
  Layers,
  Table,
  FileText,
  Send,
  Zap,
} from 'lucide-react';
import { SquadMission, AgentProfile, AgentRole } from '../types';
import { Badge, Button, Card, ProgressBar, ProgressRing, StatTile } from './ui';

interface CommandDeckProps {
  missions: SquadMission[];
  agents: AgentProfile[];
  isExecuting: boolean;
  activeAgentRole?: AgentRole;
  onNewTask: () => void;
  onSelectMission: (mission: SquadMission) => void;
  onOpenAutonomy?: () => void;
  onOpenGrowthFactory?: () => void;
  onOpenOnboarding?: () => void;
  onOpenAgents?: () => void;
  onNewAgent?: () => void;
}

const ROLE_ORDER: AgentRole[] = ['architect', 'developer', 'qa', 'creative', 'video_producer'];

export const CommandDeck: React.FC<CommandDeckProps> = ({
  missions,
  agents,
  isExecuting,
  activeAgentRole,
  onNewTask,
  onSelectMission,
  onOpenAutonomy,
  onOpenGrowthFactory,
  onOpenOnboarding,
  onOpenAgents,
  onNewAgent,
}) => {
  const completed = missions.filter((m) => m.status === 'completed');
  const latestCompleted = completed[0];
  const running = missions.filter((m) => m.status === 'running');
  const failed = missions.filter((m) => m.status === 'failed');
  const totalFiles = missions.reduce((acc, m) => acc + (m.files?.length || 0), 0);
  const totalTests = missions.reduce((acc, m) => acc + (m.execution?.testsPassed || 0), 0);
  const activeAgents = agents.filter((a) => !a.custom && (a.status === 'working' || (isExecuting && activeAgentRole === a.id)));
  const workingAgent = activeAgentRole ? agents.find((a) => a.id === activeAgentRole) : undefined;

  const recent = [...missions].slice(0, 4);
  const visibleAgents = [...agents.filter((a) => a.custom), ...agents.filter((a) => !a.custom)].slice(0, 5);
  const needsAttention = failed.length > 0;

  const stageIndex = workingAgent ? ROLE_ORDER.indexOf(workingAgent.id) : -1;
  const pipelinePercent = isExecuting
    ? Math.min(92, 12 + (stageIndex >= 0 ? stageIndex * 20 : 12))
    : completed.length > 0
    ? 100
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 as-enter">
      {/* Greeting + primary action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Command Deck
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-white">
            {isExecuting ? 'Squad is working…' : 'What should we build today?'}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl leading-6">
            {isExecuting
              ? `${workingAgent?.name || 'The squad'} is on the job — watch the live hand-offs below.`
              : 'Describe an objective and AgentStation will plan, build, verify, and deliver it.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenOnboarding && (
            <Button tone="subtle" icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />} onClick={onOpenOnboarding}>
              Test drive
            </Button>
          )}
          {onNewAgent && (
            <Button tone="subtle" icon={<Bot className="w-3.5 h-3.5 text-violet-400" />} onClick={onNewAgent}>
              New agent
            </Button>
          )}
          <Button tone="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onNewTask} disabled={isExecuting}>
            New task
          </Button>
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Completed missions"
          value={completed.length}
          tone="emerald"
          hint={`${totalTests} tests passed across all work`}
          onClick={() => latestCompleted && onSelectMission(latestCompleted)}
        />
        <StatTile
          icon={<FileCode className="w-4 h-4" />}
          label="Files generated"
          value={totalFiles}
          tone="blue"
          hint="Code, docs, and assets in your workspace"
        />
        <StatTile
          icon={<Activity className="w-4 h-4" />}
          label={isExecuting ? 'Squad active' : 'Squad idle'}
          value={isExecuting ? (workingAgent?.name || 'Working') : 'Ready'}
          tone={isExecuting ? 'amber' : 'cyan'}
          hint={isExecuting ? `${activeAgents.length} agent${activeAgents.length === 1 ? '' : 's'} on task` : `${agents.filter((agent) => !agent.custom).length} built-in specialists ready`}
        />
        <StatTile
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Needs attention"
          value={needsAttention ? failed.length : 0}
          tone={needsAttention ? 'red' : 'emerald'}
          hint={needsAttention ? 'Failed missions to review' : 'All clear'}
        />
      </div>

      {/* Live pipeline + next action */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-slate-100">Mission pipeline</span>
            </div>
            <Badge tone={isExecuting ? 'amber' : 'emerald'}>
              {isExecuting ? 'LIVE' : completed.length > 0 ? 'READY' : 'IDLE'}
            </Badge>
          </div>

          {isExecuting && workingAgent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  <span className="text-blue-400 font-bold">{workingAgent.name}</span> · {workingAgent.roleTitle}
                </span>
                <span className="font-mono text-slate-500">{pipelinePercent}%</span>
              </div>
              <ProgressBar value={pipelinePercent} tone="blue" />
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {ROLE_ORDER.map((role, idx) => {
                  const agent = agents.find((a) => a.id === role);
                  const isDone = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div key={role} className="flex items-center gap-1.5 min-w-max">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-semibold border ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-500'
                            : isDone
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <Activity className="w-3 h-3 animate-pulse" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                        {agent?.name || role}
                      </span>
                      {idx < ROLE_ORDER.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : completed.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Last mission</span>
                <span className="font-mono text-emerald-400">100% complete</span>
              </div>
              <ProgressBar value={100} tone="emerald" />
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{latestCompleted?.prompt}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {latestCompleted?.files?.length || 0} files · {latestCompleted?.execution?.testsPassed || 0} tests passed
                  </div>
                </div>
                <Button tone="subtle" size="xs" icon={<Play className="w-3 h-3" />} onClick={() => latestCompleted && onSelectMission(latestCompleted)}>
                  Open
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Terminal className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-slate-200">No missions yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-5">
                Start your first task and watch the squad plan, build, and verify it in real time.
              </p>
              <Button tone="primary" size="sm" className="mt-4" icon={<Plus className="w-3.5 h-3.5" />} onClick={onNewTask}>
                Start a mission
              </Button>
            </div>
          )}
        </Card>

        {/* Next action card */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-slate-100">Suggested next</span>
          </div>
          {isExecuting ? (
            <div className="space-y-2 text-xs text-slate-400 leading-5">
              <p>Let the squad finish — you can pause or cancel from the mission view.</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono text-amber-300">{workingAgent?.name} is working</span>
              </div>
            </div>
          ) : needsAttention ? (
            <div className="space-y-2 text-xs text-slate-400 leading-5">
              <p className="text-red-300 font-medium">A mission failed and needs your review.</p>
              <Button tone="danger" size="xs" className="mt-1" onClick={() => onSelectMission(failed[0])}>
                Review failure
              </Button>
            </div>
          ) : completed.length > 0 ? (
            <div className="space-y-2 text-xs text-slate-400 leading-5">
              <p>Your last mission is ready to explore — open the workspace to see files, tests, and artifacts.</p>
              <Button tone="primary" size="xs" className="mt-1" icon={<ArrowRight className="w-3 h-3" />} onClick={() => onSelectMission(recent[0])}>
                Open workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-400 leading-5">
              <p>Kick things off with a quick-start template or describe your own objective.</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {onOpenAutonomy && (
                  <Button tone="subtle" size="xs" icon={<Zap className="w-3 h-3 text-emerald-400" />} onClick={onOpenAutonomy}>
                    Autonomy
                  </Button>
                )}
                {onOpenGrowthFactory && (
                  <Button tone="subtle" size="xs" icon={<Film className="w-3 h-3 text-cyan-400" />} onClick={onOpenGrowthFactory}>
                    Growth Factory
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent missions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-slate-100">Recent missions</span>
          </div>
          {missions.length > 0 && (
            <button onClick={() => recent[0] && onSelectMission(recent[0])} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition">
              Open latest →
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <Card padded={false}>
            <div className="py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Nothing here yet</p>
              <p className="text-xs text-slate-500 mt-1">Your completed missions will appear here.</p>
            </div>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {recent.map((m) => {
              const statusTone =
                m.status === 'completed'
                  ? 'emerald'
                  : m.status === 'failed'
                  ? 'red'
                  : m.status === 'running'
                  ? 'amber'
                  : 'neutral';
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMission(m)}
                  className="as-card as-card-interactive text-left rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge tone={statusTone as 'emerald' | 'red' | 'amber' | 'neutral'}>
                      {m.status === 'completed' ? 'Completed' : m.status === 'failed' ? 'Failed' : m.status === 'running' ? 'Running' : 'Draft'}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-500">{m.createdAt}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-white transition">
                    {m.prompt}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><FileCode className="w-3 h-3" />{m.files?.length || 0}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{m.execution?.testsPassed || 0} tests</span>
                    {m.video?.scenes?.length ? <span className="flex items-center gap-1"><Film className="w-3 h-3 text-purple-400" />{m.video.scenes.length} scenes</span> : null}
                    {m.spreadsheet ? <span className="flex items-center gap-1"><Table className="w-3 h-3 text-teal-400" />data</span> : null}
                    {m.document ? <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-cyan-400" />doc</span> : null}
                    {m.campaign ? <span className="flex items-center gap-1"><Send className="w-3 h-3 text-orange-400" />outreach</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Squad strip */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-slate-100">Your squad</span>
          <span className="text-[10px] font-mono text-slate-500">
            {agents.length} agent{agents.length === 1 ? '' : 's'}
            {agents.some((a) => a.custom) ? ` · ${agents.filter((a) => a.custom).length} yours` : ''}
          </span>
          {onOpenAgents && (
            <button
              onClick={onOpenAgents}
              className="ml-auto text-xs text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Manage →
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {visibleAgents.map((agent) => {
            const isActive = !agent.custom && isExecuting && activeAgentRole === agent.id;
            return (
              <div
                key={agent.key || agent.id}
                className={`rounded-xl border p-3 transition ${
                  isActive
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : agent.status === 'completed'
                    ? 'border-slate-800/90 bg-slate-900/60'
                    : 'border-slate-800/70 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{agent.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{agent.roleTitle.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : agent.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className={`text-[10px] font-mono ${isActive ? 'text-blue-300' : agent.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isActive ? 'Working' : agent.status === 'completed' ? 'Ready' : 'Idle'}
                  </span>
                  {agent.custom && <span className="ml-auto text-[9px] font-mono text-violet-400">YOURS</span>}
                </div>
              </div>
            );
          })}
          {onNewAgent && (
            <button
              onClick={onNewAgent}
              className="as-card as-card-interactive rounded-xl border border-dashed border-slate-700/80 bg-slate-950/40 p-3 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200 min-h-[76px]"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[11px] font-semibold">New agent</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
