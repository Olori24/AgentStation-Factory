import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Zap,
  Film,
  Server,
  Github,
  Cpu,
  Globe,
  Code2,
  Terminal,
  Table,
  FileText,
  Send,
  Workflow,
  Sparkles,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';
import { SquadMission } from '../types';
import { WorkstationTab } from './ManusComputer';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  missions: SquadMission[];
  onSelectMission: (mission: SquadMission) => void;
  onNewTask: () => void;
  onExecutePrompt: (prompt: string) => void;
  onSelectTab: (tab: WorkstationTab) => void;
  onOpenAutonomy: () => void;
  onOpenGrowthFactory: () => void;
  onOpenFullStack: () => void;
  onOpenGitHub: () => void;
  onOpenOllama: () => void;
}

interface CommandItem {
  id: string;
  group: 'Quick Actions' | 'Objective Blueprints' | 'Workstation Views' | 'Recent Missions';
  title: string;
  subtitle: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  missions,
  onSelectMission,
  onNewTask,
  onExecutePrompt,
  onSelectTab,
  onOpenAutonomy,
  onOpenGrowthFactory,
  onOpenFullStack,
  onOpenGitHub,
  onOpenOllama,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const base: CommandItem[] = [
      {
        id: 'act-new',
        group: 'Quick Actions',
        title: 'New Autonomous Mission',
        subtitle: 'Open the omnibox to assign a new engineering or research objective',
        shortcut: 'N',
        icon: <Plus className="w-4 h-4 text-blue-400" />,
        onSelect: () => {
          onNewTask();
          onClose();
        },
      },
      {
        id: 'act-autonomy',
        group: 'Quick Actions',
        title: 'Autonomy Command Center & Multi-Agent Fabric',
        subtitle: 'Manage 24/7 recurring goals, Objective Templates, and parallel agent dispatches',
        shortcut: '⇧A',
        icon: <Zap className="w-4 h-4 text-emerald-400" />,
        onSelect: () => {
          onOpenAutonomy();
          onClose();
        },
      },
      {
        id: 'act-growth',
        group: 'Quick Actions',
        title: 'Growth Factory Studio',
        subtitle: 'Generate 30-day short-form video campaigns, hooks, and lead attribution flows',
        shortcut: '⇧G',
        icon: <Film className="w-4 h-4 text-cyan-400" />,
        onSelect: () => {
          onOpenGrowthFactory();
          onClose();
        },
      },
      {
        id: 'act-fullstack',
        group: 'Quick Actions',
        title: 'Full-Stack Operations Center',
        subtitle: 'Inspect relational DB, RBAC roles, SSE stream, job queue, and ZIP artifacts',
        shortcut: '⇧O',
        icon: <Server className="w-4 h-4 text-amber-400" />,
        onSelect: () => {
          onOpenFullStack();
          onClose();
        },
      },
      {
        id: 'act-github',
        group: 'Quick Actions',
        title: 'GitHub Repository Sync & Branch Hub',
        subtitle: 'Commit, push, switch branches, or open a Pull Request on Olori24/AgentStation',
        shortcut: '⇧P',
        icon: <Github className="w-4 h-4 text-slate-300" />,
        onSelect: () => {
          onOpenGitHub();
          onClose();
        },
      },
      {
        id: 'act-ai',
        group: 'Quick Actions',
        title: 'Switch AI Model Provider (Gemini Cloud / Local Ollama)',
        subtitle: 'Configure reasoning engine and local LLM runtime',
        icon: <Cpu className="w-4 h-4 text-indigo-400" />,
        onSelect: () => {
          onOpenOllama();
          onClose();
        },
      },
      // Objective Blueprints
      {
        id: 'tpl-real-estate',
        group: 'Objective Blueprints',
        title: 'Launch: Nigerian Real Estate Intelligence & Pitch Deck',
        subtitle: 'Hermes & Atlas analyze top 5 Lagos/Abuja opportunities + PyTest financial model',
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        onSelect: () => {
          onExecutePrompt(
            'Research the Nigerian real estate market, identify the top five opportunities, analyze competitors, create a detailed report and prepare a presentation.'
          );
          onClose();
        },
      },
      {
        id: 'tpl-kanban',
        group: 'Objective Blueprints',
        title: 'Launch: Enterprise Kanban Task Board + PyTest Suite',
        subtitle: 'Full-stack task manager with SQLite schema, REST API, and interactive preview',
        icon: <Layers className="w-4 h-4 text-blue-400" />,
        onSelect: () => {
          onExecutePrompt(
            'Build an enterprise task manager with SQLite storage, REST API, drag-and-drop Kanban, and complete PyTest suite.'
          );
          onClose();
        },
      },
      // Workstation Views
      {
        id: 'view-browser',
        group: 'Workstation Views',
        title: 'Workstation: Live Browser Preview',
        subtitle: 'Interact with the running web application in the sandbox iframe',
        shortcut: '1',
        icon: <Globe className="w-4 h-4 text-blue-400" />,
        onSelect: () => {
          onSelectTab('browser');
          onClose();
        },
      },
      {
        id: 'view-code',
        group: 'Workstation Views',
        title: 'Workstation: Multi-File Code IDE',
        subtitle: 'Inspect, edit, diff, or export generated source code files',
        shortcut: '2',
        icon: <Code2 className="w-4 h-4 text-indigo-400" />,
        onSelect: () => {
          onSelectTab('code');
          onClose();
        },
      },
      {
        id: 'view-terminal',
        group: 'Workstation Views',
        title: 'Workstation: Sandbox Terminal & PyTest Runner',
        subtitle: 'Execute shell commands and inspect live WebSocket test streams',
        shortcut: '3',
        icon: <Terminal className="w-4 h-4 text-amber-400" />,
        onSelect: () => {
          onSelectTab('terminal');
          onClose();
        },
      },
      {
        id: 'view-data',
        group: 'Workstation Views',
        title: 'Workstation: Spreadsheet Dataset Matrix',
        subtitle: 'Sort, filter, and export normalized CSV/JSON records',
        shortcut: '4',
        icon: <Table className="w-4 h-4 text-teal-400" />,
        onSelect: () => {
          onSelectTab('data');
          onClose();
        },
      },
      {
        id: 'view-report',
        group: 'Workstation Views',
        title: 'Workstation: Executive Research Dossier',
        subtitle: 'Read formatted markdown intelligence reports with Table of Contents',
        shortcut: '5',
        icon: <FileText className="w-4 h-4 text-cyan-400" />,
        onSelect: () => {
          onSelectTab('report');
          onClose();
        },
      },
      {
        id: 'view-outreach',
        group: 'Workstation Views',
        title: 'Workstation: Outreach Campaign Studio',
        subtitle: 'Review multi-touch personalized decision-maker email sequences',
        shortcut: '6',
        icon: <Send className="w-4 h-4 text-orange-400" />,
        onSelect: () => {
          onSelectTab('outreach');
          onClose();
        },
      },
      {
        id: 'view-pipeline',
        group: 'Workstation Views',
        title: 'Workstation: CI/CD Verification Pipeline',
        subtitle: 'Monitor Lint, Build, PyTest, and GitHub Actions deployment stages',
        shortcut: '7',
        icon: <Workflow className="w-4 h-4 text-emerald-400" />,
        onSelect: () => {
          onSelectTab('pipeline');
          onClose();
        },
      },
    ];

    const missionItems: CommandItem[] = missions.slice(0, 6).map((m) => ({
      id: `mission-${m.id}`,
      group: 'Recent Missions',
      title: m.prompt,
      subtitle: `${m.files?.length || 0} files • ${m.execution?.testsPassed || 0} tests passed • ${m.createdAt || 'Saved'}`,
      icon: <ArrowRight className="w-4 h-4 text-slate-400" />,
      onSelect: () => {
        onSelectMission(m);
        onClose();
      },
    }));

    return [...base, ...missionItems];
  }, [
    missions,
    onClose,
    onExecutePrompt,
    onNewTask,
    onOpenAutonomy,
    onOpenFullStack,
    onOpenGitHub,
    onOpenGrowthFactory,
    onOpenOllama,
    onSelectMission,
    onSelectTab,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
        );
      } else if (e.key === 'Enter') {
        if (filtered[selectedIndex]) {
          e.preventDefault();
          filtered[selectedIndex].onSelect();
        } else if (query.trim().length > 3) {
          e.preventDefault();
          onExecutePrompt(query.trim());
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, query, onClose, onExecutePrompt]);

  if (!isOpen) return null;

  const groups = Array.from(new Set(filtered.map((i) => i.group)));

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700/90 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[78vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        {/* Top Search Bar (Jakob's Law: VS Code / Linear / Raycast convention) */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, switch workstation view, or enter a new mission objective..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Command Palette"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No matching command found. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">Enter</kbd> to dispatch the squad on this custom objective:
              </p>
              <button
                type="button"
                onClick={() => {
                  if (query.trim()) {
                    onExecutePrompt(query.trim());
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dispatch: "{query.trim()}"</span>
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  {group}
                </div>
                {filtered
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const flatIndex = filtered.indexOf(item);
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                        onClick={item.onSelect}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                            : 'border border-transparent text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        {item.shortcut && (
                          <kbd className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-blue-400">AgentStation Command Bar</span>
        </div>
      </div>
    </div>
  );
};
