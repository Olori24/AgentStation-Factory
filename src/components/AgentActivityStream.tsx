import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Check, Filter, Compass, Code2, ShieldCheck, Megaphone, Film, Table, Send, Briefcase } from 'lucide-react';
import { AgentLogEntry, AgentRole } from '../types';

interface AgentActivityStreamProps {
  logs: AgentLogEntry[];
  isExecuting: boolean;
}

const ROLE_COLORS: Record<AgentRole, { bg: string; text: string; icon: React.ReactNode }> = {
  architect: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  developer: {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: <Code2 className="w-3.5 h-3.5" />,
  },
  qa: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  creative: {
    bg: 'bg-pink-500/10 border-pink-500/30',
    text: 'text-pink-400',
    icon: <Megaphone className="w-3.5 h-3.5" />,
  },
  video_producer: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-400',
    icon: <Film className="w-3.5 h-3.5" />,
  },
  researcher: {
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    text: 'text-cyan-400',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  data_analyst: {
    bg: 'bg-teal-500/10 border-teal-500/30',
    text: 'text-teal-400',
    icon: <Table className="w-3.5 h-3.5" />,
  },
  operations: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    text: 'text-orange-400',
    icon: <Send className="w-3.5 h-3.5" />,
  },
  admin: {
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    text: 'text-indigo-400',
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  system: {
    bg: 'bg-slate-800/60 border-slate-700/60',
    text: 'text-slate-300',
    icon: <Terminal className="w-3.5 h-3.5" />,
  },
};

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({
  logs,
  isExecuting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!autoScroll) {
      setHasUnread(true);
      return;
    }
    container.scrollTop = container.scrollHeight;
    setHasUnread(false);
  }, [logs, isExecuting, autoScroll]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const atLatest = distanceFromBottom < 24;
    if (atLatest) {
      if (!autoScroll) setAutoScroll(true);
      setHasUnread(false);
    } else if (autoScroll) {
      setAutoScroll(false);
    }
  };

  const handleReturnToLatest = () => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    setAutoScroll(true);
    setHasUnread(false);
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.agentName}]: ${l.message} ${l.details ? `(${l.details})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = selectedRole === 'all'
    ? logs
    : logs.filter((l) => l.role === selectedRole);

  return (
    <section aria-label="Mission activity" className="as-activity-stream flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Stream Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Squad Activity Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{logs.length} events</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isExecuting ? "bg-blue-500/10 border-blue-500/25 text-blue-300" : "bg-slate-900 border-slate-700 text-slate-500"}`}>{isExecuting ? "LIVE" : "IDLE"}</span>
        </div>

        <div className="flex items-center gap-2">
          {!autoScroll && (
            <button
              type="button"
              onClick={handleReturnToLatest}
              aria-label="Return activity stream to latest events"
              className="min-h-9 px-2.5 rounded-md bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 text-[11px] font-semibold transition"
            >
              {hasUnread ? 'New activity · Latest' : 'Return to latest'}
            </button>
          )}
          {/* Role Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
            <select
              aria-label="Filter activity by agent"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-800 text-slate-300 text-[11px] rounded-md pl-6 pr-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Agents</option>
              <option value="architect">Atlas (Architect)</option>
              <option value="developer">Cypher (Developer)</option>
              <option value="qa">Sentinel (QA)</option>
              <option value="creative">Vesper (Creative)</option>
              <option value="video_producer">Nova (Video)</option>
            </select>
          </div>

          <button
            onClick={handleCopyLogs}
            title="Copy all logs"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scrollbar-thin"
      >
        {!autoScroll && logs.length > filteredLogs.length && (
          <div className="sticky top-0 z-10 mb-2 text-[10px] text-slate-500 bg-slate-900/95 rounded-md px-2 py-1 border border-slate-800">
            Viewing filtered activity while live updates continue.
          </div>
        )}

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6"><div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3"><Terminal className="w-4 h-4 text-slate-500" /></div><p className="text-sm font-semibold text-slate-300">No activity yet</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">Start a mission and this surface will show squad hand-offs, verification events, and outcomes.</p></div>
        ) : (
          filteredLogs.map((log) => {
            const roleStyle = ROLE_COLORS[log.role] || ROLE_COLORS.system;

            return (
              <article
                key={log.id}
                className="group relative pl-3 border-l-2 border-slate-800 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text}`}
                  >
                    {roleStyle.icon}
                    {log.agentName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                    [{log.type}]
                  </span>
                </div>
                <div className="text-slate-200 text-xs leading-relaxed font-sans sm:font-mono">
                  {log.message}
                </div>
                {log.details && (
                  <div className="mt-1 p-2 rounded bg-slate-950/70 text-[11px] text-slate-400 border border-slate-800/80 break-words">
                    {log.details}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isExecuting && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span>Agent cluster is deliberating and executing tasks...</span>
          </div>
        )}
      </div>
    </section>
  );
};
