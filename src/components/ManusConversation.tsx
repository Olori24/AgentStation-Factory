import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  Terminal,
  ShieldCheck,
  Film,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  ArrowRight,
  ExternalLink,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  AlertCircle,
  XCircle,
  Wrench,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { SquadMission, AgentLogEntry, AgentRole, SubtaskRecord, ApprovalRecord } from '../types';

interface ManusConversationProps {
  mission: SquadMission;
  isExecuting: boolean;
  activeAgentRole?: AgentRole;
  onExecuteFollowUp: (prompt: string) => void;
  onNewTask: () => void;
  onSelectTab?: (tab: 'browser' | 'terminal' | 'code' | 'video' | 'pipeline') => void;
}

interface PlanStep {
  id: string;
  title: string;
  role: AgentRole;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  toolName?: string;
  description?: string;
}

export const ManusConversation: React.FC<ManusConversationProps> = ({
  mission,
  isExecuting,
  activeAgentRole,
  onExecuteFollowUp,
  onNewTask,
  onSelectTab,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);
  const [isLogsExpanded, setIsLogsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [subtasks, setSubtasks] = useState<SubtaskRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRecord[]>([]);
  const [isResolvingApproval, setIsResolvingApproval] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for subtasks and approvals for active mission
  const fetchTaskDetails = async () => {
    if (!mission?.id) return;
    try {
      const res = await fetch(`/api/tasks/${mission.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          if (Array.isArray(data.task.subtasks) && data.task.subtasks.length > 0) {
            setSubtasks(data.task.subtasks);
          }
          if (Array.isArray(data.task.approvals)) {
            setPendingApprovals(data.task.approvals.filter((a: ApprovalRecord) => a.status === 'pending'));
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchTaskDetails();
    let pollInterval: any = null;
    if (isExecuting) {
      pollInterval = setInterval(fetchTaskDetails, 3000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [mission?.id, isExecuting]);

  useEffect(() => {
    let interval: any = null;
    if (isExecuting && !isPaused) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting, isPaused]);

  // Auto scroll to bottom when new logs arrive while executing
  useEffect(() => {
    if (isExecuting && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mission.logs?.length, isExecuting, pendingApprovals.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUpText.trim() || isExecuting) return;
    onExecuteFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePauseResume = async () => {
    if (!mission?.id) return;
    try {
      const endpoint = isPaused ? `/api/tasks/${mission.id}/resume` : `/api/tasks/${mission.id}/pause`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        setIsPaused(!isPaused);
      }
    } catch {}
  };

  const handleCancelTask = async () => {
    if (!mission?.id) return;
    try {
      await fetch(`/api/tasks/${mission.id}/cancel`, { method: 'POST' });
      setIsPaused(false);
    } catch {}
  };

  const handleRespondApproval = async (approvalId: string, approved: boolean) => {
    setIsResolvingApproval(true);
    try {
      const res = await fetch(`/api/tasks/${mission.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, approved, responder: 'Operator (You)' }),
      });
      if (res.ok) {
        setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
        fetchTaskDetails();
      }
    } catch (err) {
      console.error('Failed to resolve approval', err);
    } finally {
      setIsResolvingApproval(false);
    }
  };

  // Build the autonomous stages for the plan (from server subtasks or fallback default)
  const getPlanSteps = (): PlanStep[] => {
    if (subtasks.length > 0) {
      return subtasks.map((st) => ({
        id: st.id,
        title: st.title,
        description: st.description,
        role: (st.assignedAgent as AgentRole) || 'developer',
        status: st.status,
        toolName: st.toolName,
      }));
    }

    const roleOrder: AgentRole[] = ['architect', 'developer', 'qa', 'video_producer'];
    const currentIdx = activeAgentRole ? roleOrder.indexOf(activeAgentRole) : 1;

    const baseSteps: { id: string; title: string; role: AgentRole }[] = [
      { id: '1', title: 'Understand user requirements & project architecture', role: 'architect' },
      { id: '2', title: 'Scaffold application structure & data models', role: 'architect' },
      { id: '3', title: 'Implement full-stack source code, styling & state', role: 'developer' },
      { id: '4', title: 'Run isolated sandbox PyTest test suite', role: 'qa' },
      { id: '5', title: 'Launch live interactive app in AgentStation Workstation', role: 'video_producer' },
    ];

    return baseSteps.map((step, idx) => {
      if (!isExecuting) {
        return { ...step, status: 'completed' as const };
      }
      if (idx < currentIdx) {
        return { ...step, status: 'completed' as const };
      }
      if (idx === currentIdx) {
        return { ...step, status: 'in_progress' as const };
      }
      return { ...step, status: 'pending' as const };
    });
  };

  const planSteps = getPlanSteps();

  const QUICK_PROMPTS = [
    'Add dark mode theme toggle',
    'Run pytest -v in terminal',
    'Add input validation & alerts',
    'Generate full README documentation',
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-200 font-sans">
      {/* Top Header of the Conversation */}
      <div className="h-14 px-5 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Task</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
              {mission.prompt}
            </h2>
          </div>
        </div>

        {/* Status indicator & Execution Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePauseResume}
                title={isPaused ? "Resume execution" : "Pause execution"}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <button
                onClick={handleCancelTask}
                title="Cancel execution"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-600/50 text-slate-400 hover:text-red-400 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-amber-400 animate-ping'}`} />
                <span>{isPaused ? 'AgentStation Paused' : `AgentStation Working (${elapsedSeconds}s)`}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin min-h-0">
        {/* 1. User Message */}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">You</span>
              <span className="text-[11px] font-mono text-slate-500">{mission.createdAt || 'Now'}</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed font-sans">
              {mission.prompt}
            </p>
          </div>
        </div>

        {/* 2. OPERATOR APPROVAL REQUESTS (Live Human-in-the-Loop) */}
        {pendingApprovals.length > 0 && (
          <div className="max-w-3xl space-y-3">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 shadow-lg shadow-amber-950/50 space-y-3 animate-pulse-slow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                    <ShieldAlert className="w-4 h-4" />
                    <span>OPERATOR APPROVAL REQUIRED</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    High-Risk Action
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {approval.action}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 font-sans">
                    {approval.reason}
                  </p>
                  {approval.details && (
                    <pre className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300/90 font-mono text-xs overflow-x-auto">
                      {JSON.stringify(approval.details, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleRespondApproval(approval.id, true)}
                    disabled={isResolvingApproval}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve & Continue</span>
                  </button>
                  <button
                    onClick={() => handleRespondApproval(approval.id, false)}
                    disabled={isResolvingApproval}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 border border-slate-700 hover:border-red-600/60 text-slate-300 hover:text-red-400 font-medium text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Action</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. AgentStation Autonomous Message */}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
            <Bot className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-4">
            {/* Agent Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">AgentStation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-blue-400">
                Autonomous Squad
              </span>
            </div>

            {/* A. AgentStation Plan Checklist Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div
                onClick={() => setIsPlanExpanded(!isPlanExpanded)}
                className="px-4 py-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                    Plan
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({planSteps.filter((s) => s.status === 'completed').length}/{planSteps.length} completed)
                  </span>
                </div>
                {isPlanExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {isPlanExpanded && (
                <div className="p-3.5 space-y-2">
                  {planSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {step.status === 'completed' ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : step.status === 'in_progress' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin shrink-0" />
                        ) : step.status === 'failed' ? (
                          <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                            <XCircle className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 shrink-0" />
                        )}

                        <div className="truncate">
                          <span
                            className={`font-sans ${
                              step.status === 'completed'
                                ? 'text-slate-300'
                                : step.status === 'in_progress'
                                ? 'text-amber-300 font-semibold'
                                : step.status === 'failed'
                                ? 'text-red-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {idx + 1}. {step.title}
                          </span>
                          {step.description && step.description !== step.title && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {step.toolName && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-400 flex items-center gap-1">
                            <Wrench className="w-2.5 h-2.5" />
                            {step.toolName}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          {step.status === 'completed'
                            ? 'Done'
                            : step.status === 'in_progress'
                            ? 'Running'
                            : step.status === 'failed'
                            ? 'Failed'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. Real-Time Tool Actions / Thoughts */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
              <div
                onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    Execution Steps ({mission.logs?.length || 0})
                  </span>
                </div>
                {isLogsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {isLogsExpanded && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin text-xs font-mono">
                  {mission.logs && mission.logs.length > 0 ? (
                    mission.logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <div
                          key={log.id}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 hover:border-slate-700/80 cursor-pointer transition flex flex-col gap-1 leading-relaxed"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                              {log.timestamp}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-slate-200">
                                <span className="text-blue-400 font-semibold">[{log.agentName}]:</span>
                                <span className="text-slate-300 font-sans">{log.message}</span>
                              </div>
                            </div>
                            {log.details && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                          {log.details && isExpanded && (
                            <div className="mt-1 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-2 rounded border border-slate-800 break-all font-mono whitespace-pre-wrap">
                              {log.details}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-500 py-2 text-center text-xs">
                      Initializing autonomous agent...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* C. Completion Deliverable Summary */}
            {!isExecuting && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Objective Completed by AgentStation</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mission.files?.length || 0} files created • {mission.execution?.testsPassed || 0} tests passed
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The objective has been executed and verified in the sandbox.
                  You can interact with the app, examine artifacts and source code, or run commands in the <strong>AgentStation Workstation</strong> (open in the right panel or tap the Workstation tab on mobile).
                </p>

                {onSelectTab && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectTab('browser')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Open Workstation Browser</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('code')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
                    >
                      View Source Code
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('terminal')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
                    >
                      View Terminal Logs
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('video')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium text-xs transition"
                    >
                      Watch Promo Video
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('pipeline')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs transition"
                    >
                      CI/CD Pipeline
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Follow-Up Chat Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Direct AgentStation squad or refine objective... (e.g. Add dark mode, run tests)"
            disabled={isExecuting}
            className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl pl-4 pr-12 py-3 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={!followUpText.trim() || isExecuting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition shadow-md shadow-blue-600/30"
            title="Send instruction to AgentStation"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick prompt suggestions */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin text-xs">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setFollowUpText(prompt);
                onExecuteFollowUp(prompt);
              }}
              disabled={isExecuting}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800 transition whitespace-nowrap disabled:opacity-50"
            >
              + {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
