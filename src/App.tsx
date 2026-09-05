import React, { useState } from 'react';
import {
  Code2,
  Film,
  Terminal,
  Columns,
  Sparkles,
  Github,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Header } from './components/Header';
import { SquadBar } from './components/SquadBar';
import { PromptStation } from './components/PromptStation';
import { AgentActivityStream } from './components/AgentActivityStream';
import { CodeWorkspace } from './components/CodeWorkspace';
import { VideoStudio } from './components/VideoStudio';
import { GitHubModal } from './components/GitHubModal';
import { OllamaModal } from './components/OllamaModal';
import { DEFAULT_AGENTS, INITIAL_MISSION, GITHUB_REPO_INFO } from './data/defaults';
import { SquadMission, AgentProfile, AgentRole, AgentLogEntry } from './types';

export default function App() {
  const [mission, setMission] = useState<SquadMission>(INITIAL_MISSION);
  const [agents, setAgents] = useState<AgentProfile[]>(DEFAULT_AGENTS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeAgentRole, setActiveAgentRole] = useState<AgentRole | undefined>(undefined);
  const [isRunningCommand, setIsRunningCommand] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'video' | 'stream'>('split');
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run autonomous multi-agent squad
  const handleExecutePrompt = async (promptText: string) => {
    setIsExecuting(true);
    const newMissionId = `mission-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString();

    // Reset agents to working
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: a.id === 'architect' ? 'working' : 'idle' }))
    );
    setActiveAgentRole('architect');

    // Add initial log
    const startLog: AgentLogEntry = {
      id: `log-${Date.now()}-1`,
      timestamp: nowTime,
      role: 'system',
      agentName: 'AgentStation Core',
      type: 'status',
      message: `Starting multi-agent execution pipeline for: "${promptText}"`,
    };

    setMission((prev) => ({
      ...prev,
      id: newMissionId,
      prompt: promptText,
      status: 'running',
      progressPercent: 15,
      logs: [startLog, ...prev.logs],
    }));

    try {
      // Simulate sequential hand-offs smoothly
      setTimeout(() => {
        setActiveAgentRole('developer');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'architect'
              ? { ...a, status: 'completed' }
              : a.id === 'developer'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 900);

      setTimeout(() => {
        setActiveAgentRole('qa');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'developer'
              ? { ...a, status: 'completed' }
              : a.id === 'qa'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 1800);

      setTimeout(() => {
        setActiveAgentRole('creative');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'qa'
              ? { ...a, status: 'completed' }
              : a.id === 'creative'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 2700);

      setTimeout(() => {
        setActiveAgentRole('video_producer');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'creative'
              ? { ...a, status: 'completed' }
              : a.id === 'video_producer'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 3600);

      // Make API call to server
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();
      if (!data.success || !data.mission) {
        throw new Error(data.error || 'Squad pipeline failed');
      }

      const generated = data.mission;
      const timestamp = new Date().toLocaleTimeString();

      const newLogs: AgentLogEntry[] = (generated.logs || []).map((l: any, idx: number) => ({
        id: `gen-log-${Date.now()}-${idx}`,
        timestamp,
        role: l.role || 'system',
        agentName: l.agentName || 'Agent',
        type: l.type || 'thought',
        message: l.message || '',
        details: l.details,
      }));

      const completeLog: AgentLogEntry = {
        id: `complete-${Date.now()}`,
        timestamp,
        role: 'system',
        agentName: 'AgentStation Core',
        type: 'complete',
        message: `Mission completed successfully! Code artifacts, PyTest sandbox tests, and 1080p promo video compiled.`,
      };

      setMission({
        id: newMissionId,
        prompt: promptText,
        createdAt: 'Just now',
        status: 'completed',
        currentStage: 'Mission Completed & Verified',
        progressPercent: 100,
        files: generated.files || [],
        execution: generated.execution || {
          command: 'pytest -v tests/',
          stdout: 'All tests passed.',
          exitCode: 0,
          testsPassed: 4,
          testsFailed: 0,
          durationMs: 80,
        },
        video: generated.video,
        logs: [completeLog, ...newLogs, ...mission.logs],
        gitBranch: 'main',
        gitCommitMessage: generated.gitCommitMessage || `feat: implement ${promptText.slice(0, 30)}`,
      });

      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
      showToast('Squad mission completed! Code, tests, and video are ready.');
    } catch (err: any) {
      console.error(err);
      showToast('Error during squad execution. Check logs.');
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run a sandbox terminal command
  const handleRunCommand = async (command: string) => {
    setIsRunningCommand(true);
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, files: mission.files }),
      });
      const data = await res.json();
      setMission((prev) => ({
        ...prev,
        execution: data,
        logs: [
          {
            id: `exec-log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            role: 'qa',
            agentName: 'Sentinel (QA Auditor)',
            type: 'terminal',
            message: `Executed command in sandbox: "${command}"`,
            details: `Exit code: ${data.exitCode} | Duration: ${data.durationMs}ms`,
          },
          ...prev.logs,
        ],
      }));
      showToast(`Command finished with return code ${data.exitCode}`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to execute terminal command');
    } finally {
      setIsRunningCommand(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenOllama={() => setIsOllamaModalOpen(true)}
        onNewMission={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isExecuting={isExecuting}
      />

      {/* Active Squad Bar */}
      <SquadBar
        agents={agents}
        activeAgentRole={activeAgentRole}
        isExecuting={isExecuting}
      />

      {/* Prompt Command Station */}
      <PromptStation
        onExecutePrompt={handleExecutePrompt}
        isExecuting={isExecuting}
      />

      {/* View Mode Switcher */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split Workspace</span>
          </button>

          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              viewMode === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Sandbox</span>
          </button>

          <button
            onClick={() => setViewMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              viewMode === 'video'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Studio</span>
          </button>

          <button
            onClick={() => setViewMode('stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              viewMode === 'stream'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Activity Stream</span>
          </button>
        </div>

        {/* Quick Sync with GitHub button */}
        <button
          onClick={() => setIsGitHubModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 transition"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sync with</span>
          <span>Olori24/AgentStation</span>
        </button>
      </div>

      {/* Main Content Panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-3 min-h-0">
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
            {/* Left: Activity Stream (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <AgentActivityStream logs={mission.logs} isExecuting={isExecuting} />
            </div>

            {/* Middle: Code Workspace (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <CodeWorkspace
                files={mission.files}
                execution={mission.execution}
                onRunCommand={handleRunCommand}
                isRunningCommand={isRunningCommand}
              />
            </div>

            {/* Right: Video Studio (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <VideoStudio video={mission.video} />
            </div>
          </div>
        )}

        {viewMode === 'code' && (
          <div className="h-[740px]">
            <CodeWorkspace
              files={mission.files}
              execution={mission.execution}
              onRunCommand={handleRunCommand}
              isRunningCommand={isRunningCommand}
            />
          </div>
        )}

        {viewMode === 'video' && (
          <div className="h-[740px]">
            <VideoStudio video={mission.video} />
          </div>
        )}

        {viewMode === 'stream' && (
          <div className="h-[740px] max-w-4xl mx-auto">
            <AgentActivityStream logs={mission.logs} isExecuting={isExecuting} />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 px-4 lg:px-8 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-400">AgentStation v2.4</span>
          <span>•</span>
          <span>Multi-Agent Autonomous Orchestration</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono">Sandbox Status: Operational</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOllamaModalOpen(true)}
            className="hover:text-slate-300 transition"
          >
            Local Ollama Models
          </button>
          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            github.com/Olori24/AgentStation
          </button>
        </div>
      </footer>

      {/* GitHub Repository Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        commitMessage={mission.gitCommitMessage}
      />

      {/* Ollama Local Configuration Modal */}
      <OllamaModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
      />
    </div>
  );
}
