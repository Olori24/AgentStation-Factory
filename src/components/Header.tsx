import React from 'react';
import { Bot, GitBranch, Github, Cpu, Radio, Sparkles } from 'lucide-react';
import { GITHUB_REPO_INFO } from '../data/defaults';

interface HeaderProps {
  onOpenGitHub: () => void;
  onOpenOllama: () => void;
  onNewMission: () => void;
  isExecuting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGitHub,
  onOpenOllama,
  onNewMission,
  isExecuting,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Status */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 text-white">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              AgentStation
            </h1>
            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v2.4 Fullstack
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Autonomous Multi-Agent Engineering & Video Studio
          </p>
        </div>
      </div>

      {/* Center cluster status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
        <Radio className={`w-3.5 h-3.5 ${isExecuting ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
        <span className="text-slate-300">
          {isExecuting ? 'Squad Active: Synthesizing Mission...' : 'Cluster: 5 Agents Synchronized'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
        <span className="text-slate-400">Gemini 2.5 + Ollama Bridge</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenOllama}
          title="Configure Local Ollama"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Local Ollama</span>
        </button>

        <button
          onClick={onOpenGitHub}
          title="GitHub Repository & Push Guide"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <Github className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Repo:</span>
          <span className="font-mono text-blue-400">{GITHUB_REPO_INFO.owner}/{GITHUB_REPO_INFO.repo}</span>
          <GitBranch className="w-3 h-3 text-slate-500" />
        </button>

        <button
          onClick={onNewMission}
          disabled={isExecuting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Mission</span>
        </button>
      </div>
    </header>
  );
};
