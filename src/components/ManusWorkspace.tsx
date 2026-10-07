import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Send,
  CheckCircle2,
  Clock,
  Compass,
  Code2,
  ShieldCheck,
  Film,
  Check,
  ChevronRight,
  RotateCcw,
  Terminal,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  SquadMission,
  AgentProfile,
  AgentRole,
  WorkspaceFile,
  VideoProject,
  TestExecutionResult,
} from '../types';
import { AgentActivityStream } from './AgentActivityStream';
import { CodeWorkspace } from './CodeWorkspace';

interface ManusWorkspaceProps {
  mission: SquadMission;
  agents: AgentProfile[];
  isExecuting: boolean;
  activeAgentRole?: AgentRole;
  onExecuteFollowUpPrompt: (prompt: string) => void;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
  streamingTerminalOutput?: string;
  isStreamingTerminal?: boolean;
  isWsConnected?: boolean;
  onClearTerminal?: () => void;
  onUpdateFile?: (fileIndex: number, newContent: string) => void;
  onAddFile?: (newFile: WorkspaceFile) => void;
  onDeleteFile?: (fileIndex: number) => void;
  onUpdateVideo?: (updated: VideoProject) => void;
  onPushToGitHub?: () => void;
  onNewMission: () => void;
}

const STAGES = [
  { id: 'architect', label: 'Plan & Architect', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'developer', label: 'Generate Code', icon: <Code2 className="w-3.5 h-3.5" /> },
  { id: 'qa', label: 'Sandbox & PyTest', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'video_producer', label: 'Video Studio', icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'delivery', label: 'Ready to Run', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

const FOLLOW_UP_SUGGESTIONS = [
  'Add dark mode theme toggle',
  'Run pytest -v in sandbox',
  'Add input validation & error toasts',
  'Generate full documentation in README.md',
];

export const ManusWorkspace: React.FC<ManusWorkspaceProps> = ({
  mission,
  agents,
  isExecuting,
  activeAgentRole,
  onExecuteFollowUpPrompt,
  onRunCommand,
  isRunningCommand,
  streamingTerminalOutput,
  isStreamingTerminal = false,
  isWsConnected = false,
  onClearTerminal,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onUpdateVideo,
  onPushToGitHub,
  onNewMission,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isExecuting) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);

  const handleFollowUpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUpText.trim() || isExecuting) return;
    onExecuteFollowUpPrompt(followUpText.trim());
    setFollowUpText('');
  };

  const getStageStatus = (stageId: string, index: number) => {
    // Never infer success from an inactive worker. Only the persisted mission
    // outcome can mark the pipeline complete.
    if (mission.status === 'completed') return 'completed';
    const roleOrder = ['architect', 'developer', 'qa', 'video_producer', 'delivery'];
    const currentIdx = activeAgentRole ? roleOrder.indexOf(activeAgentRole) : -1;
    if (mission.status === 'failed') return index === currentIdx ? 'failed' : 'pending';
    if (mission.status !== 'running' || !isExecuting) return 'pending';
    if (currentIdx < 0) return 'pending';
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'pending';
  };

  const completedStages = STAGES.filter((stage, idx) => getStageStatus(stage.id, idx) === 'completed').length;
  const activeStage = STAGES.find((stage, idx) => getStageStatus(stage.id, idx) === 'active');
  const verified = mission.status === 'completed' && completedStages === STAGES.length;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 as-cinematic-shell">
      {/* Workspace Subheader / Stage Stepper */}
      <div className="as-glass border-x-0 border-t-0 border-b border-slate-800/70 px-3 sm:px-4 lg:px-8 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Mission Title & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onNewMission}
              className="as-focus-ring flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition shrink-0"
              title="Start a fresh new prompt"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Task</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-blue-300/80 uppercase tracking-[0.18em]">
                  Objective
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-100 truncate max-w-[48vw] sm:max-w-2xl">
                  {mission.prompt}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {agents.length} agents
            </span>
            {mission.status === 'running' && isExecuting ? (
              <div role="status" aria-live="polite" className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Squad Working ({elapsedSeconds}s)</span>
              </div>
            ) : mission.status === 'completed' ? (
              <div role="status" className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mission Completed</span>
              </div>
            ) : mission.status === 'failed' ? (
              <div role="status" className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-mono">
                <span>Mission Failed</span>
              </div>
            ) : (
              <div role="status" className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Not Started</span>
              </div>
            )}
          </div>
        </div>

        {/* 5-Step Autonomous Pipeline Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {STAGES.map((stage, idx) => {
            const status = getStageStatus(stage.id, idx);
            return (
              <div key={stage.id} className="flex items-center gap-2 min-w-max">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    status === 'active'
                      ? 'bg-blue-500/15 text-blue-200 border border-blue-400/30 shadow-[0_0_28px_rgba(59,130,246,.12)] font-bold'
                      : status === 'completed'
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                      : 'bg-slate-950 text-slate-500 border border-slate-800/50'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    stage.icon
                  )}
                  <span>{stage.label}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Pane AgentStation Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 lg:px-8 py-3 sm:py-5 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-auto lg:h-[min(760px,calc(100dvh-170px))] min-h-0">
          {/* Left Column: Autonomous Squad Activity & Follow-up Chat (4 cols) */}
          <div className="lg:col-span-4 min-h-0 flex flex-col gap-3 order-2 lg:order-1">
            {/* Real-time Activity Stream */}
            <div className="as-glass rounded-2xl p-2 flex-1 min-h-0 shadow-2xl">
              <div className="flex items-center justify-between px-2 py-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">Execution evidence</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeStage ? activeStage.label : verified ? 'Verified delivery' : mission.status === 'failed' ? 'Recovery required' : 'Awaiting execution'}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{completedStages}/{STAGES.length} stages</span>
              </div>
              <div className="h-[calc(100%-52px)] min-h-0">
                <AgentActivityStream logs={mission.logs} isExecuting={isExecuting} />
              </div>
            </div>

            {/* Follow-up Prompt Input Box (AgentStation Chat) */}
            <div className="as-glass rounded-2xl p-3 shadow-2xl">
              <div className="text-[11px] font-mono text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  Direct Agent Squad
                </span>
                <span className="text-[10px] text-slate-500">Refine or add feature</span>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="relative">
                <input
                  type="text"
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder="e.g. Add dark mode, run tests, fix styling..."
                  disabled={isExecuting}
                  className="as-focus-ring w-full bg-black/20 text-slate-100 text-xs rounded-xl pl-3 pr-10 py-3 border border-white/10 focus:border-blue-400/60 font-sans disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!followUpText.trim() || isExecuting}
                  className="as-focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-40 transition"
                  title="Send prompt to squad"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick follow-up pills */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                {FOLLOW_UP_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFollowUpText(suggestion);
                      onExecuteFollowUpPrompt(suggestion);
                    }}
                    disabled={isExecuting}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition whitespace-nowrap disabled:opacity-50"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Unified Deliverable Canvas (8 cols) */}
          <div className="lg:col-span-8 min-h-[520px] lg:h-full flex flex-col min-h-0 order-1 lg:order-2 as-glass rounded-2xl p-1.5 sm:p-2 shadow-2xl">
            <CodeWorkspace
              files={mission.files}
              execution={mission.execution}
              video={mission.video}
              onUpdateVideo={onUpdateVideo}
              defaultTab="preview"
              onRunCommand={onRunCommand}
              isRunningCommand={isRunningCommand}
              streamingTerminalOutput={streamingTerminalOutput}
              isStreamingTerminal={isStreamingTerminal}
              isWsConnected={isWsConnected}
              onClearTerminal={onClearTerminal}
              onUpdateFile={onUpdateFile}
              onAddFile={onAddFile}
              onDeleteFile={onDeleteFile}
              onPushToGitHub={onPushToGitHub}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
