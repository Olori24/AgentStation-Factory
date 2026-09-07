import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Film,
  Terminal,
  Columns,
  Sparkles,
  Github,
  CheckCircle2,
  AlertTriangle,
  History,
  Bot,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { Header } from './components/Header';
import { SquadBar } from './components/SquadBar';
import { PromptStation } from './components/PromptStation';
import { AgentActivityStream } from './components/AgentActivityStream';
import { CodeWorkspace } from './components/CodeWorkspace';
import { VideoStudio } from './components/VideoStudio';
import { GitHubModal } from './components/GitHubModal';
import { OllamaModal } from './components/OllamaModal';
import { MissionHistoryPanel } from './components/MissionHistoryPanel';
import { UserOnboardingModal } from './components/UserOnboardingModal';
import { FullStackOperationsModal } from './components/FullStackOperationsModal';
import { ManusHeroPrompt } from './components/ManusHeroPrompt';
import { ManusWorkspace } from './components/ManusWorkspace';
import { ManusSidebar } from './components/ManusSidebar';
import { ManusConversation } from './components/ManusConversation';
import { ManusComputer } from './components/ManusComputer';
import { DEFAULT_AGENTS, INITIAL_MISSION, GITHUB_REPO_INFO } from './data/defaults';
import { SAMPLE_MISSIONS } from './data/sampleMissions';
import { SquadMission, AgentProfile, AgentRole, AgentLogEntry, WorkspaceFile, VideoProject, CiStatusInfo, TerminalStreamMessage } from './types';
import { executeAutonomousPipeline, simulateSandboxCommand } from './services/autonomousEngine';

export default function App() {
  const [missionHistory, setMissionHistory] = useState<SquadMission[]>(() => {
    try {
      const saved = localStorage.getItem('agentstation_missions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_MISSIONS;
  });

  const [mission, setMission] = useState<SquadMission>(() => {
    return missionHistory[0] || INITIAL_MISSION;
  });
  const [isHomePromptMode, setIsHomePromptMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [computerTab, setComputerTab] = useState<'browser' | 'terminal' | 'code' | 'video' | 'pipeline'>('browser');
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'workstation'>('chat');
  const [agents, setAgents] = useState<AgentProfile[]>(DEFAULT_AGENTS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeAgentRole, setActiveAgentRole] = useState<AgentRole | undefined>(undefined);
  const [isRunningCommand, setIsRunningCommand] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'video' | 'stream'>('split');
  const [notification, setNotification] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama'>(() => {
    try {
      return (localStorage.getItem('agentstation_provider') as 'gemini' | 'ollama') || 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    try {
      return localStorage.getItem('agentstation_ollama_model') || 'llama3';
    } catch {
      return 'llama3';
    }
  });
  const [ciStatus, setCiStatus] = useState<CiStatusInfo | null>(null);
  const [isFullStackModalOpen, setIsFullStackModalOpen] = useState(false);

  // Real-time WebSocket terminal streamer state
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [streamingTerminalOutput, setStreamingTerminalOutput] = useState<string>(() => {
    return mission?.execution?.stdout || '';
  });
  const [isStreamingTerminal, setIsStreamingTerminal] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Synchronize terminal output buffer when active mission changes
  useEffect(() => {
    if (mission?.execution?.stdout) {
      setStreamingTerminalOutput(mission.execution.stdout);
    }
  }, [mission?.id]);

  // WebSocket terminal streaming listener
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let active = true;

    const connectWebSocket = () => {
      if (!active) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setIsWsConnected(true);
          if (mission?.id) {
            ws?.send(JSON.stringify({ type: 'subscribe', missionId: mission.id }));
          }
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data: TerminalStreamMessage = JSON.parse(event.data);
            if (data.type === 'terminal_start') {
              setIsStreamingTerminal(true);
              setIsRunningCommand(true);
              const header = `$ ${data.command}\n`;
              setStreamingTerminalOutput(header);
            } else if (data.type === 'terminal_chunk') {
              if (data.text) {
                setStreamingTerminalOutput((prev) => prev + data.text);
              }
            } else if (data.type === 'terminal_exit') {
              setIsStreamingTerminal(false);
              setIsRunningCommand(false);
              setMission((prev) => {
                const finalStdout = data.command
                  ? `$ ${data.command}\n${data.text || ''}`
                  : prev.execution?.stdout || '';
                return {
                  ...prev,
                  execution: {
                    command: data.command || prev.execution?.command || '',
                    stdout: finalStdout || prev.execution?.stdout || '',
                    exitCode: data.exitCode ?? 0,
                    testsPassed: data.testsPassed ?? prev.execution?.testsPassed ?? 0,
                    testsFailed: data.testsFailed ?? prev.execution?.testsFailed ?? 0,
                    durationMs: data.durationMs ?? prev.execution?.durationMs ?? 0,
                  },
                  logs: [
                    {
                      id: `exec-log-${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      role: 'qa',
                      agentName: 'Sentinel (QA Auditor)',
                      type: 'terminal',
                      message: `Sandbox execution stream finished: "${data.command || 'terminal'}"`,
                      details: `Exit code: ${data.exitCode} | Duration: ${data.durationMs}ms`,
                    },
                    ...prev.logs,
                  ],
                };
              });
            } else if (data.type === 'connection_established') {
              setIsWsConnected(true);
            }
          } catch (e) {
            console.debug('WebSocket stream parse note:', e);
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setIsWsConnected(false);
          setIsStreamingTerminal(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          if (!active) return;
          setIsWsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket init note:', err);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [mission?.id]);

  useEffect(() => {
    let isMounted = true;
    const fetchCi = async () => {
      try {
        const res = await fetch('/api/github/ci-status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ciStatus) {
            setCiStatus(data.ciStatus);
          }
        }
      } catch (err) {
        console.debug('CI fetch note:', err);
      }
    };

    fetchCi();
    const interval = setInterval(fetchCi, 20000);

    // Initial server missions fetch and merge
    const loadServerMissions = async () => {
      try {
        const res = await fetch('/api/missions');
        const data = await res.json();
        if (data.success && Array.isArray(data.missions) && data.missions.length > 0) {
          setMissionHistory((prev) => {
            const merged = [...data.missions];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id)) {
                merged.push(p);
              }
            });
            try {
              localStorage.setItem('agentstation_missions_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch {
        // Offline fallback
      }
    };
    loadServerMissions();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectProvider = (p: 'gemini' | 'ollama') => {
    setAiProvider(p);
    try {
      localStorage.setItem('agentstation_provider', p);
    } catch {}
    showToast(`Switched active AI engine to ${p === 'gemini' ? 'Gemini 2.5 Flash (Cloud)' : 'Ollama (Local Private)'}`);
  };

  const handleSelectOllamaModel = (m: string) => {
    setOllamaModel(m);
    try {
      localStorage.setItem('agentstation_ollama_model', m);
    } catch {}
  };

  const persistMissionToServer = async (missionItem: SquadMission) => {
    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionItem),
      });
    } catch {
      // offline / transient
    }
  };

  // Sync mission history changes to localStorage & server
  const saveHistoryToStorage = (updatedList: SquadMission[]) => {
    try {
      localStorage.setItem('agentstation_missions_v1', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Failed to persist mission history:', err);
    }
  };

  const updateHistoryWithMission = (updatedMission: SquadMission) => {
    setMissionHistory((prev) => {
      const idx = prev.findIndex((m) => m.id === updatedMission.id);
      let next: SquadMission[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedMission;
      } else {
        next = [updatedMission, ...prev];
      }
      saveHistoryToStorage(next);
      return next;
    });
    persistMissionToServer(updatedMission);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run autonomous multi-agent squad
  const handleExecutePrompt = async (promptText: string) => {
    setIsHomePromptMode(false);
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
        setComputerTab('terminal');
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

      // Trigger autonomous task planner to generate actionable subtasks in database
      fetch('/api/tasks/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: newMissionId,
          prompt: promptText,
        }),
      }).catch(() => {});

      // Execute mission via autonomous pipeline (attempts server API, falls back gracefully to in-engine synthesizer on error or static hosting)
      const finalMission = await executeAutonomousPipeline({
        missionId: newMissionId,
        prompt: promptText,
        aiProvider,
        ollamaModel,
      });

      // Retain context from previous logs
      finalMission.logs = [...finalMission.logs, ...mission.logs];

      setMission(finalMission);
      updateHistoryWithMission(finalMission);
      setComputerTab('browser');
      setMobileActiveView('workstation'); // Auto-switch on mobile so user sees the live result!

      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
      showToast('Squad mission completed! Code, tests, and preview are ready.');
    } catch (err: any) {
      console.error('Autonomous squad error:', err);
      const errMsg = err?.message || 'Execution error during multi-agent handoff';
      const failLog: AgentLogEntry = {
        id: `fail-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        role: 'system',
        agentName: 'AgentStation Core',
        type: 'status',
        message: `Pipeline halted: ${errMsg}`,
        details: 'Check AI provider configuration or network connection.',
      };
      setMission((prev) => ({
        ...prev,
        status: 'failed',
        currentStage: 'Mission Halted - Error Reported',
        logs: [failLog, ...prev.logs],
      }));
      showToast(`Notice: ${errMsg.slice(0, 50)}`);
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run a sandbox terminal command with real-time streaming
  const handleRunCommand = async (command: string) => {
    setIsRunningCommand(true);
    setIsStreamingTerminal(true);
    const startBanner = `$ [SANDBOX ISOLATED] ${command}\n`;
    setStreamingTerminalOutput(startBanner);

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          files: mission.files,
          missionId: mission.id,
        }),
      });

      let data: any = null;
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        }
      }

      // If backend is offline or static hosting, simulate sandbox command runner
      if (!data) {
        data = simulateSandboxCommand(command, mission.files, mission.gitBranch);
      }

      setMission((prev) => ({
        ...prev,
        execution: {
          command: data.command || command,
          stdout: data.stdout || startBanner,
          exitCode: data.exitCode ?? 0,
          testsPassed: data.testsPassed ?? 0,
          testsFailed: data.testsFailed ?? 0,
          durationMs: data.durationMs ?? 0,
        },
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
      setStreamingTerminalOutput((prev) => (prev && prev.length > startBanner.length ? prev : data.stdout || startBanner));
      showToast(`Command finished with return code ${data.exitCode}`);
    } catch (err: any) {
      console.warn('Terminal backend fetch failed, using sandbox simulator:', err);
      const data = simulateSandboxCommand(command, mission.files, mission.gitBranch);
      setStreamingTerminalOutput(data.stdout);
      showToast('Command executed in sandbox simulation (exit 0)');
    } finally {
      setIsRunningCommand(false);
      setIsStreamingTerminal(false);
    }
  };

  const handleUpdateFile = (fileIndex: number, newContent: string) => {
    setMission((prev) => {
      const updatedFiles = [...prev.files];
      if (updatedFiles[fileIndex]) {
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          content: newContent,
        };
      }
      const updated = { ...prev, files: updatedFiles };
      updateHistoryWithMission(updated);
      return updated;
    });
  };

  const handleAddFile = (newFile: any) => {
    setMission((prev) => {
      const updated = {
        ...prev,
        files: [...prev.files, newFile],
      };
      updateHistoryWithMission(updated);
      return updated;
    });
    showToast(`Created file ${newFile.name}`);
  };

  const handleDeleteFile = (fileIndex: number) => {
    setMission((prev) => {
      const fileName = prev.files[fileIndex]?.name;
      const updatedFiles = prev.files.filter((_, idx) => idx !== fileIndex);
      const updated = { ...prev, files: updatedFiles };
      updateHistoryWithMission(updated);
      showToast(`Removed ${fileName}`);
      return updated;
    });
  };

  const handleUpdateVideo = (updatedVideo: any) => {
    setMission((prev) => {
      const updated = {
        ...prev,
        video: updatedVideo,
      };
      updateHistoryWithMission(updated);
      return updated;
    });
  };

  const handleSelectMission = (selected: SquadMission) => {
    setMission(selected);
    setStreamingTerminalOutput(selected.execution?.stdout || '');
    setIsHomePromptMode(false);
    showToast(`Loaded mission: "${selected.prompt.slice(0, 36)}..."`);
  };

  const handleDeleteMission = (id: string) => {
    setMissionHistory((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveHistoryToStorage(next);
      return next;
    });
    if (mission.id === id) {
      const remaining = missionHistory.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        setMission(remaining[0]);
      }
    }
    fetch(`/api/missions/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Mission removed from history.');
  };

  const handleResetToDefaults = () => {
    setMissionHistory(SAMPLE_MISSIONS);
    setMission(SAMPLE_MISSIONS[0]);
    saveHistoryToStorage(SAMPLE_MISSIONS);
    showToast('Mission history reset to seed templates.');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main 3-Panel AgentStation Application */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Panel 1: Left Navigation Rail / Sidebar */}
        <ManusSidebar
          missions={missionHistory}
          currentMissionId={mission.id}
          onSelectMission={handleSelectMission}
          onNewTask={() => setIsHomePromptMode(true)}
          onDeleteMission={handleDeleteMission}
          isExecuting={isExecuting}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenGitHub={() => setIsGitHubModalOpen(true)}
          onOpenOllama={() => setIsOllamaModalOpen(true)}
          onOpenFullStack={() => setIsFullStackModalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          aiProvider={aiProvider}
        />

        {/* Panel 2 & 3: AgentStation Workstation */}
        {isHomePromptMode ? (
          <div className="flex-1 flex flex-col justify-center overflow-y-auto min-h-0 bg-slate-950">
            <ManusHeroPrompt
              onExecutePrompt={handleExecutePrompt}
              isExecuting={isExecuting}
              recentMissions={missionHistory}
              onSelectMission={handleSelectMission}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Mobile View Switcher (Visible on mobile screens < 1024px) */}
            <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full">
                <button
                  type="button"
                  onClick={() => setMobileActiveView('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                    mobileActiveView === 'chat'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Squad & Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveView('workstation')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                    mobileActiveView === 'workstation'
                      ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Workstation ({mission.files?.length || 0})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Panel 2: Center Conversational Stream & Autonomous Plan */}
              <div
                className={`w-full lg:w-[48%] xl:w-[45%] h-full min-h-0 border-r border-slate-800/80 flex flex-col ${
                  mobileActiveView === 'chat' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <ManusConversation
                  mission={mission}
                  isExecuting={isExecuting}
                  activeAgentRole={activeAgentRole}
                  onExecuteFollowUp={handleExecutePrompt}
                  onNewTask={() => setIsHomePromptMode(true)}
                  onSelectTab={(tab) => {
                    setComputerTab(tab);
                    setMobileActiveView('workstation');
                  }}
                />
              </div>

              {/* Panel 3: Right "AgentStation Workstation" (Virtual Sandbox / Live MicroVM) */}
              <div
                className={`flex-1 h-full min-h-0 p-2 sm:p-3 bg-slate-900/30 flex-col ${
                  mobileActiveView === 'workstation' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                {/* On mobile, show a top bar to quickly toggle back to chat */}
                <div className="lg:hidden mb-2 flex items-center justify-between px-3 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileActiveView('chat')}
                    className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Squad Chat</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {computerTab.toUpperCase()} ACTIVE
                  </span>
                </div>

                <ManusComputer
                  files={mission.files}
                  execution={mission.execution}
                  video={mission.video}
                  onUpdateVideo={handleUpdateVideo}
                  activeTab={computerTab}
                  onTabChange={setComputerTab}
                  onRunCommand={handleRunCommand}
                  isRunningCommand={isRunningCommand}
                  streamingTerminalOutput={streamingTerminalOutput}
                  isStreamingTerminal={isStreamingTerminal}
                  isWsConnected={isWsConnected}
                  onClearTerminal={() => setStreamingTerminalOutput('')}
                  onUpdateFile={handleUpdateFile}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  onPushToGitHub={() => setIsGitHubModalOpen(true)}
                  missionStatus={mission.status}
                  ciStatus={ciStatus}
                  gitBranch={mission.gitBranch || 'main'}
                  gitCommitMessage={mission.gitCommitMessage}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GitHub Repository Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        commitMessage={mission.gitCommitMessage}
        currentBranch={mission.gitBranch || 'main'}
        missionFiles={mission.files}
        onSuccessNotification={(msg) => showToast(msg)}
        onBranchChange={(newBranch) => {
          setMission((prev) => {
            const updated = { ...prev, gitBranch: newBranch };
            updateHistoryWithMission(updated);
            return updated;
          });
        }}
      />

      {/* Ollama Local Configuration Modal */}
      <OllamaModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        aiProvider={aiProvider}
        onSelectProvider={handleSelectProvider}
        selectedModel={ollamaModel}
        onSelectModel={handleSelectOllamaModel}
      />

      {/* Mission Execution History Side-Panel */}
      <MissionHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        missions={missionHistory}
        activeMissionId={mission.id}
        onSelectMission={handleSelectMission}
        onDeleteMission={handleDeleteMission}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Real-World Use Case Onboarding & Test Drive Modal */}
      <UserOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSelectMission={(m) => {
          setMission(m);
          updateHistoryWithMission(m);
          setAgents(DEFAULT_AGENTS.map((a) => ({ ...a, status: 'completed' })));
          setActiveAgentRole(undefined);
          showToast(`Loaded real-world use case: "${m.prompt.slice(0, 45)}..."`);
        }}
        onRunPrompt={(p) => {
          handleExecutePrompt(p);
        }}
        aiProvider={aiProvider}
        ollamaModel={ollamaModel}
      />

      {/* Full-Stack Operations Center Modal (Phases 1-5) */}
      <FullStackOperationsModal
        isOpen={isFullStackModalOpen}
        onClose={() => setIsFullStackModalOpen(false)}
        currentMission={mission}
        onToast={showToast}
      />
    </div>
  );
}
