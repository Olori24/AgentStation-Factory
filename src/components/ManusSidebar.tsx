import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Cpu,
  Github,
  PanelLeftClose,
  PanelLeft,
  Server,
  HelpCircle,
  ExternalLink,
  Bot,
  Film,
  Zap,
  Command,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { SquadMission } from '../types';
import { Badge, EmptyState, Tooltip } from './ui';

interface ManusSidebarProps {
  missions: SquadMission[];
  currentMissionId?: string;
  onSelectMission: (mission: SquadMission) => void;
  onNewTask: () => void;
  onGoHome?: () => void;
  onDeleteMission?: (id: string) => void;
  isExecuting: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenGitHub?: () => void;
  onOpenOllama?: () => void;
  onOpenFullStack?: () => void;
  onOpenOnboarding?: () => void;
  onOpenGrowthFactory?: () => void;
  onOpenAutonomy?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAgents?: () => void;
  onNewAgent?: () => void;
  aiProvider: 'gemini' | 'ollama';
  isMobile?: boolean;
  isDeckMode?: boolean;
}

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-400',
  running: 'bg-amber-400 animate-pulse',
  failed: 'bg-red-400',
  cancelled: 'bg-slate-500',
  idle: 'bg-slate-600',
};

export const ManusSidebar: React.FC<ManusSidebarProps> = ({
  missions,
  currentMissionId,
  onSelectMission,
  onNewTask,
  onGoHome,
  onDeleteMission,
  isExecuting,
  isOpen,
  onToggleOpen,
  onOpenGitHub,
  onOpenOllama,
  onOpenFullStack,
  onOpenOnboarding,
  onOpenGrowthFactory,
  onOpenAutonomy,
  onOpenCommandPalette,
  onOpenAgents,
  onNewAgent,
  aiProvider,
  isMobile = false,
  isDeckMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMissions = missions.filter((m) =>
    m.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    if (isMobile) return null;
    return (
      <div className="w-14 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-3 justify-between shrink-0 select-none">
        <div className="flex flex-col items-center gap-3">
          <Tooltip label="Expand navigation">
            <button
              onClick={onToggleOpen}
              aria-label="Expand navigation"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </Tooltip>

          {onGoHome && (
            <Tooltip label="Command Deck">
              <button
                onClick={onGoHome}
                aria-label="Go to Command Deck"
                className={`p-2 rounded-lg transition ${isDeckMode ? 'text-blue-400 bg-blue-950/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          <Tooltip label="New task">
            <button
              onClick={onNewTask}
              aria-label="New task"
              disabled={isExecuting}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>

          {onOpenCommandPalette && (
            <Tooltip label="Command palette (⌘K)">
              <button
                onClick={onOpenCommandPalette}
                aria-label="Open command palette"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              >
                <Command className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-slate-500">
          {onOpenAutonomy && (
            <Tooltip label="Autonomy">
              <button onClick={onOpenAutonomy} aria-label="Autonomy" className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-950/60 transition">
                <Zap className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
          {onOpenGrowthFactory && (
            <Tooltip label="Growth Factory">
              <button onClick={onOpenGrowthFactory} aria-label="Growth Factory" className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-950/60 transition">
                <Film className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
          <Tooltip label="GitHub sync">
            <button onClick={onOpenGitHub} aria-label="GitHub sync" className="p-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/80 transition">
              <Github className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip label="AI engine settings">
            <button onClick={onOpenOllama} aria-label="AI engine settings" className="p-2 rounded-lg hover:text-slate-200 hover:bg-slate-800/80 transition">
              <Cpu className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="AgentStation navigation"
      className={`as-sidebar w-[min(20rem,88vw)] lg:w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-full min-h-0 text-slate-200 font-sans transition-transform duration-200 ${
        isMobile ? 'fixed inset-y-0 left-0 z-[90] lg:static lg:z-auto shadow-2xl lg:shadow-none' : ''
      } ${isMobile && !isOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
    >
      {/* Top Header & Primary Action */}
      <div className="p-3.5 pb-2 border-b border-slate-800/70">
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 group"
            title="Go to Command Deck"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-blue-300 transition">AgentStation</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-800/60 font-semibold">
                SQUAD
              </span>
            </div>
          </button>

          <button
            onClick={onToggleOpen}
            title="Collapse navigation"
            aria-label="Collapse navigation"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary action row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewTask}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>New task</span>
          </button>

          {onOpenCommandPalette && (
            <Tooltip label="Command palette (⌘K)">
              <button
                onClick={onOpenCommandPalette}
                aria-label="Open command palette"
                className="px-2.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 transition"
              >
                <Command className="w-3.5 h-3.5 text-blue-400" />
                <span>K</span>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Home / Deck entry */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className={`mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              isDeckMode
                ? 'bg-slate-800/90 text-white border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
            <span>Command Deck</span>
          </button>
        )}

        {/* My agents entry */}
        {onOpenAgents && (
          <button
            onClick={onOpenAgents}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent transition"
          >
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span>My agents</span>
            {onNewAgent && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Create a new agent"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewAgent();
                }}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onNewAgent();
                  }
                }}
                className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-950/60 border border-violet-800/60 text-[10px] text-violet-300 hover:bg-violet-900/60 transition"
              >
                <Plus className="w-2.5 h-2.5" />
                New
              </span>
            )}
          </button>
        )}

        {/* Search */}
        <div className="mt-2.5 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions…"
            aria-label="Search recent tasks"
            className="w-full py-2 pl-8 pr-2.5 text-xs bg-slate-900/90 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800/80 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Mission list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
        <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Recent missions</span>
          <span>{filteredMissions.length}</span>
        </div>

        {filteredMissions.length === 0 ? (
          <EmptyState
            compact
            icon={<Search className="w-4 h-4" />}
            title={searchQuery ? 'No matches' : 'No missions yet'}
            description={searchQuery ? 'Try a different search term.' : 'Start a task to see it here.'}
          />
        ) : (
          filteredMissions.map((m) => {
            const isSelected = m.id === currentMissionId && !isDeckMode;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMission(m)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMission(m);
                  }
                }}
                className={`group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[m.status] || 'bg-slate-600'}`} />
                    <div className="truncate text-xs text-slate-200 group-hover:text-white">
                      {m.prompt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1 pl-3">
                    <span>{m.createdAt || 'Recent'}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{m.files?.length || 0} files</span>
                    <span>•</span>
                    <span>{m.execution?.testsPassed || 0} tests</span>
                  </div>
                </div>

                {onDeleteMission && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMission(m.id);
                    }}
                    title="Delete task"
                    aria-label={`Delete mission: ${m.prompt.slice(0, 40)}`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer — grouped, quieter */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-slate-600 font-semibold">Workspace</div>

        <div className="grid grid-cols-2 gap-1.5">
          {onOpenAutonomy && (
            <button
              onClick={onOpenAutonomy}
              className="py-2 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-[11px] text-emerald-300 border border-emerald-800/60 transition flex items-center justify-center gap-1.5 font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autonomy</span>
            </button>
          )}
          {onOpenGrowthFactory && (
            <button
              onClick={onOpenGrowthFactory}
              className="py-2 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-[11px] text-cyan-300 border border-cyan-900/60 transition flex items-center justify-center gap-1.5 font-medium"
            >
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Growth</span>
            </button>
          )}
        </div>

        <button
          onClick={onOpenOllama}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 text-[11px] text-slate-300 transition"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">
              {aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Local Ollama'}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={onOpenGitHub}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 text-[11px] text-slate-300 transition"
        >
          <div className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Olori24/AgentStation-Factory</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </button>

        <div className="flex items-center gap-2 pt-0.5">
          {onOpenFullStack && (
            <button
              onClick={onOpenFullStack}
              className="flex-1 py-1.5 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 text-center transition flex items-center justify-center gap-1"
            >
              <Server className="w-3 h-3 text-amber-400" />
              <span>Full-Stack</span>
            </button>
          )}

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="flex-1 py-1.5 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 text-center transition flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-emerald-400" />
              <span>Tour</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
