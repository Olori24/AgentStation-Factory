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
  Zap,
  Palette,
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
import { ManusComputer, WorkstationTab } from './components/ManusComputer';
import { GrowthFactoryModal } from './components/GrowthFactoryModal';
import { GradientStudio } from './components/GradientStudio';
import { AutonomyCommandCenter } from './components/AutonomyCommandCenter';
import { CommandPalette } from './components/CommandPalette';
import { DEFAULT_AGENTS, INITIAL_MISSION, GITHUB_REPO_INFO } from './data/defaults';
import { SAMPLE_MISSIONS } from './data/sampleMissions';
import { SquadMission, AgentProfile, AgentRole, AgentLogEntry, WorkspaceFile, VideoProject, CiStatusInfo, TerminalStreamMessage } from './types';
import { executeAutonomousPipeline, simulateSandboxCommand } from './services/autonomousEngine';

function AgentStationApp() {
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
  const [computerTab, setComputerTab] = useState<WorkstationTab>('browser');
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'workstation'>('chat');
  const [agents, setAgents] = useState<AgentProfile[]>(DEFAULT_AGENTS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionControl, setExecutionControl] = useState<'running' | 'paused' | 'cancelling' | 'cancelled'>('running');
  const executionControlRef = useRef<'running' | 'paused' | 'cancelling' | 'cancelled'>('running');
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
  const [isGrowthFactoryOpen, setIsGrowthFactoryOpen] = useState(false);
  const [isGradientStudioOpen, setIsGradientStudioOpen] = useState(false);
  const [isAutonomyOpen, setIsAutonomyOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Global ⌘K / Ctrl+K shortcut for Command Palette (Jakob's Law)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
    executionControlRef.current = 'running';
    setExecutionControl('running');
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
      // Emit initial Atlas SSE telemetry
      fetch('/api/stream/test-emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'Atlas (Architect)',
          thought: `Decomposing objective into modular architecture & subtasks: "${promptText.slice(0, 60)}"`,
        }),
      }).catch(() => {});

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
        fetch('/api/stream/test-emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'Cypher (Lead Engineer)',
            thought: 'Synthesizing typed application modules, interactive UI, and workspace artifacts.',
          }),
        }).catch(() => {});
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
        fetch('/api/stream/test-emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'Sentinel (QA Auditor)',
            thought: 'Executing automated verification suite and sandbox assertions.',
          }),
        }).catch(() => {});
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
        fetch('/api/stream/test-emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'Vesper (Dossier & Strategy)',
            thought: 'Compiling executive dossier, structured spreadsheet dataset, and outreach sequence.',
          }),
        }).catch(() => {});
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
        existingFiles: mission?.files,
      });

      // A cancelled mission must never be overwritten by a late pipeline result.
      if (executionControlRef.current === 'cancelled') {
        const cancelledMission: SquadMission = {
          ...mission,
          id: newMissionId,
          prompt: promptText,
          status: 'cancelled',
          currentStage: 'Mission Cancelled by Operator',
          progressPercent: 0,
          logs: [{
            id: `cancel-log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            role: 'system',
            agentName: 'AgentStation Core',
            type: 'status',
            message: 'Mission cancelled by operator. Late execution results were discarded.',
          }, ...mission.logs],
        };
        setMission(cancelledMission);
        updateHistoryWithMission(cancelledMission);
        setAgents((prev) => prev.map((a) => ({ ...a, status: 'idle' })));
        setActiveAgentRole(undefined);
        return;
      }

      // Retain context from previous logs
      finalMission.logs = [...finalMission.logs, ...mission.logs];

      // Persist all generated mission files to workspace/ disk (Phase 2 + Phase 3 SSE sync)
      if (Array.isArray(finalMission.files) && finalMission.files.length > 0) {
        fetch('/api/files/save-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId: newMissionId,
            files: finalMission.files,
          }),
        }).catch(() => {});
      }

      setMission(finalMission);
      updateHistoryWithMission(finalMission);
      if (finalMission.spreadsheet) {
        setComputerTab('data');
      } else {
        setComputerTab('browser');
      }
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
      if (executionControlRef.current !== 'cancelled') {
        executionControlRef.current = 'running';
        setExecutionControl('running');
      }
    }
  };

  const handleMissionControl = (action: 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel') {
      executionControlRef.current = 'cancelled';
      setExecutionControl('cancelled');
      setIsExecuting(false);
      setActiveAgentRole(undefined);
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'idle' })));
      return;
    }
    const next = action === 'pause' ? 'paused' : 'running';
    executionControlRef.current = next;
    setExecutionControl(next);
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
    // Selecting a mission completes the mobile navigation action; return
    // focus to the workspace instead of leaving the drawer over the content.
    setIsSidebarOpen(false);
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
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* Mobile top bar — keeps the primary navigation compact instead of competing with the workspace */}
        {!isHomePromptMode && (
          <div className="lg:hidden absolute top-0 left-0 right-0 z-40 h-14 px-3 flex items-center justify-between bg-slate-950/95 backdrop-blur border-b border-slate-800">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
              className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-200"
            >
              <Bot className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">AgentStation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAutonomyOpen(true)}
                aria-label="Open Autonomy Command Center"
                className="w-10 h-10 rounded-xl border border-emerald-900/60 bg-emerald-950/40 flex items-center justify-center text-emerald-300"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsGrowthFactoryOpen(true)}
                aria-label="Open Growth Factory"
                className="w-10 h-10 rounded-xl border border-cyan-900/60 bg-cyan-950/40 flex items-center justify-center text-cyan-300"
              >
                <Film className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsGradientStudioOpen(true)}
                aria-label="Open Gradient Studio"
                className="w-10 h-10 rounded-xl border border-violet-900/60 bg-violet-950/40 flex items-center justify-center text-violet-300"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isSidebarOpen && !isHomePromptMode && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-[80] bg-black/60 backdrop-blur-[1px]"
          />
        )}

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
          isMobile={true}
          onOpenGitHub={() => setIsGitHubModalOpen(true)}
          onOpenOllama={() => setIsOllamaModalOpen(true)}
          onOpenFullStack={() => setIsFullStackModalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenGrowthFactory={() => setIsGrowthFactoryOpen(true)}
          onOpenAutonomy={() => setIsAutonomyOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
              onOpenAutonomy={() => setIsAutonomyOpen(true)}
              onOpenGrowthFactory={() => setIsGrowthFactoryOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-14 lg:pt-0">
            {/* Mobile View Switcher (Visible on mobile screens < 1024px) */}
            <div className="lg:hidden fixed bottom-2 left-2 right-2 z-[70] px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setMobileActiveView('chat')}
                  className={`flex-1 min-h-11 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
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
                  <span aria-label={isWsConnected ? "workstation connected" : "workstation offline"} className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
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
                  executionControl={executionControl}
                  onMissionControl={handleMissionControl}
                  activeAgentRole={activeAgentRole}
                  onExecuteFollowUp={handleExecutePrompt}
                  onNewTask={() => {
             setIsHomePromptMode(true);
             setIsSidebarOpen(false);
           }}
                  onSelectTab={(tab) => {
                    setComputerTab(tab);
                    setMobileActiveView('workstation');
                  }}
                  onOpenFileInWorkstation={(filePath) => {
                    setSelectedFilePath(filePath);
                    setComputerTab('code');
                    setMobileActiveView('workstation');
                    showToast(`Opened ${filePath} in Code IDE`);
                  }}
                />
              </div>

              {/* Panel 3: Right "AgentStation Workstation" (Virtual Sandbox / Live MicroVM) */}
              <div
                className={`flex-1 h-full min-h-0 p-2 sm:p-3 bg-slate-900/30 flex-col ${
                  mobileActiveView === 'workstation' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <ManusComputer
                  files={mission.files}
                  execution={mission.execution}
                  video={mission.video}
                  spreadsheet={mission.spreadsheet}
                  document={mission.document}
                  campaign={mission.campaign}
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
                  selectedFilePath={selectedFilePath}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {isGradientStudioOpen && <GradientStudio onClose={() => setIsGradientStudioOpen(false)} onToast={showToast} />}

      <AutonomyCommandCenter
        isOpen={isAutonomyOpen}
        onClose={() => setIsAutonomyOpen(false)}
        onToast={showToast}
      />

      {isGrowthFactoryOpen && (
        <GrowthFactoryModal
          onClose={() => setIsGrowthFactoryOpen(false)}
          onMountCampaignToWorkstation={({ project, objective, campaign, targetTab = 'report' }) => {
            const angles = Array.isArray(campaign?.angles) ? campaign.angles : [];
            const trackingPattern = campaign?.tracking?.campaignIdPattern || `gf_${project.id}`;
            const markdownDossier = [
              `# ${campaign?.name || `${project.name} 30-Day Growth Campaign`}`,
              `> **Project:** ${project.name} (${project.offer})  `,
              `> **Target Audience:** ${project.audience}  `,
              `> **Tracking Pattern:** \`${trackingPattern}\``,
              ``,
              `## 1. Strategic Positioning & Objective`,
              `${campaign?.positioning || objective}`,
              ``,
              `## 2. High-Converting Short-Form Angles`,
              ...angles.map(
                (a: any, idx: number) =>
                  `### Angle ${idx + 1}: ${a.title || `Hook ${idx + 1}`}\n- **Hook:** "${a.hook}"\n- **Format:** ${a.format || '9:16 Reel'}\n- **CTA:** ${a.cta}\n- **Conversion Goal:** ${a.conversionGoal || 'Qualified Lead'}`
              ),
              ``,
              `## 3. 4-Week Execution Rollout`,
              ...(campaign?.weeklyPlan || []).map(
                (w: any) => `- **Week ${w.week} (${w.posts} posts):** ${w.focus}`
              ),
            ].join('\n');

            const spreadsheetRows = angles.map((a: any, idx: number) => ({
              angle_id: `ANG-0${idx + 1}`,
              project: project.name,
              title: a.title || `Angle ${idx + 1}`,
              hook: a.hook || '',
              format: a.format || '9:16 Reel',
              cta: a.cta || 'Book Discovery Call',
              conversion_goal: a.conversionGoal || 'Qualified Lead',
              tracking_code: `${trackingPattern}_ang${idx + 1}`,
              status: 'Ready',
            }));

            const csvHeader = 'angle_id,project,title,hook,format,cta,conversion_goal,tracking_code,status';
            const csvBody = spreadsheetRows
              .map((r: any) =>
                [
                  r.angle_id,
                  `"${r.project}"`,
                  `"${String(r.title).replace(/"/g, '""')}"`,
                  `"${String(r.hook).replace(/"/g, '""')}"`,
                  `"${r.format}"`,
                  `"${String(r.cta).replace(/"/g, '""')}"`,
                  `"${r.conversion_goal}"`,
                  r.tracking_code,
                  r.status,
                ].join(',')
              )
              .join('\n');

            const interactiveHtmlDashboard = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${project.name} — Growth Factory Attribution Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase">Growth Factory Live App</span>
        <h1 class="text-xl font-extrabold text-white mt-2">${project.name} — 30-Day Funnel & Attribution</h1>
        <p class="text-xs text-slate-400 mt-1">${project.offer} • Target: ${project.audience}</p>
      </div>
      <div class="text-right font-mono text-xs">
        <div class="text-slate-400">Tracking Pattern</div>
        <div class="text-emerald-400 font-bold mt-0.5">${trackingPattern}</div>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid sm:grid-cols-3 gap-4">
      <div>
        <label class="text-[11px] font-mono text-slate-400 uppercase">Projected 30D Views</label>
        <input id="viewsInput" type="number" value="45000" oninput="recalc()" class="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm font-mono text-white" />
      </div>
      <div>
        <label class="text-[11px] font-mono text-slate-400 uppercase">Click-to-Lead Rate (%)</label>
        <input id="rateInput" type="number" step="0.5" value="3.5" oninput="recalc()" class="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm font-mono text-white" />
      </div>
      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-center">
        <span class="text-[10px] font-mono uppercase text-emerald-300">Estimated Qualified Leads</span>
        <span id="leadsOut" class="text-2xl font-extrabold text-emerald-400 font-mono">1,575</span>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      ${angles
        .map(
          (a: any, i: number) => `<div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-cyan-400 font-bold">ANGLE 0${i + 1}: ${a.title || 'Hook'}</span>
          <span class="px-2 py-0.5 rounded bg-slate-950 text-slate-400">${a.format || '9:16 Reel'}</span>
        </div>
        <p class="text-xs font-semibold text-white leading-relaxed">"${a.hook || ''}"</p>
        <div class="text-[11px] font-mono text-emerald-400">CTA: ${a.cta || ''}</div>
      </div>`
        )
        .join('\n')}
    </div>
  </div>
  <script>
    function recalc() {
      var v = Number(document.getElementById('viewsInput').value || 0);
      var r = Number(document.getElementById('rateInput').value || 0);
      var leads = Math.round(v * (r / 100));
      document.getElementById('leadsOut').textContent = leads.toLocaleString();
    }
  </script>
</body>
</html>`;

            const campaignFiles: WorkspaceFile[] = [
              {
                name: 'index.html',
                path: 'public/index.html',
                language: 'html',
                content: interactiveHtmlDashboard,
              },
              {
                name: 'growth_blueprint.md',
                path: 'reports/growth_blueprint.md',
                language: 'markdown',
                content: markdownDossier,
              },
              {
                name: 'campaign_attribution.py',
                path: 'src/campaign_attribution.py',
                language: 'python',
                content: `"""\nGrowth Factory Attribution Tracker — ${project.name}\nTracking Pattern: ${trackingPattern}\n"""\n\nANGLES = ${JSON.stringify(spreadsheetRows, null, 2)}\n\ndef compute_conversion_rate(views: int, leads: int) -> float:\n    if views <= 0:\n        return 0.0\n    return round((leads / views) * 100.0, 2)\n\nif __name__ == "__main__":\n    print(f"Loaded {len(ANGLES)} growth angles for ${project.name}")\n`,
              },
              {
                name: 'test_campaign_attribution.py',
                path: 'tests/test_campaign_attribution.py',
                language: 'python',
                content: `from src.campaign_attribution import ANGLES, compute_conversion_rate\n\ndef test_angles_populated():\n    assert len(ANGLES) >= 1\n\ndef test_conversion_math():\n    assert compute_conversion_rate(1000, 45) == 4.5\n`,
              },
              ...(mission.files || []).filter(
                (f) =>
                  ![
                    'public/index.html',
                    'reports/growth_blueprint.md',
                    'src/campaign_attribution.py',
                    'tests/test_campaign_attribution.py',
                  ].includes(f.path)
              ),
            ];

            const campaignVideo: VideoProject = {
              title: `${project.name} 30D Launch`,
              hook: (angles[0]?.hook || `${project.name}: ${project.offer}`).toUpperCase().slice(0, 64),
              subtitle: campaign?.positioning || objective,
              totalDurationSec: 16,
              soundtrackMood: 'energetic-tech',
              audioScript: `Introducing the 30-day Growth Factory campaign for ${project.name}. ${angles[0]?.hook || ''} ${angles[0]?.cta || ''}`,
              scenes: angles.slice(0, 4).map((a: any, idx: number) => ({
                id: `gf-scene-${idx + 1}`,
                sceneIndex: idx,
                durationSec: 4,
                badge: `ANGLE 0${idx + 1} • ${a.format || '9:16 REEL'}`,
                heading: (a.title || `GROWTH HOOK ${idx + 1}`).toUpperCase(),
                subheading: a.hook || objective,
                bulletPoints: [
                  `Offer: ${project.offer}`,
                  `CTA: ${a.cta || 'Direct WhatsApp Lead'}`,
                  `Track: ${trackingPattern}_ang${idx + 1}`,
                ],
                accentColor: ['#06b6d4', '#10b981', '#3b82f6', '#8b5cf6'][idx % 4],
                callToAction: a.cta || project.name,
              })),
            };

            const newMissionId = `growth-${Date.now()}`;
            const mountedMission: SquadMission = {
              ...mission,
              id: newMissionId,
              prompt: `[Growth Factory] ${project.name}: ${objective}`,
              createdAt: 'Just now',
              status: 'completed',
              currentStage: 'Growth Campaign Mounted in Workstation',
              progressPercent: 100,
              files: campaignFiles,
              video: campaignVideo,
              spreadsheet: {
                id: `sheet-gf-${Date.now()}`,
                title: `${project.name} — 30-Day Content & Attribution Matrix`,
                description: `Tracked short-form video hooks, formats, CTAs, and attribution codes for ${project.audience}`,
                totalCount: spreadsheetRows.length,
                csvContent: `${csvHeader}\n${csvBody}`,
                summaryMetrics: [
                  { label: 'Project', value: project.name },
                  { label: 'Duration', value: '30 Days' },
                  { label: 'Angles', value: String(spreadsheetRows.length) },
                  { label: 'Tracking Prefix', value: trackingPattern },
                ],
                columns: [
                  { key: 'angle_id', label: 'ID', type: 'badge' },
                  { key: 'title', label: 'Angle Title', type: 'text' },
                  { key: 'hook', label: 'Viral Hook Script', type: 'text' },
                  { key: 'format', label: 'Format', type: 'badge' },
                  { key: 'cta', label: 'Call To Action', type: 'text' },
                  { key: 'tracking_code', label: 'Tracking ID', type: 'badge' },
                ],
                rows: spreadsheetRows,
              },
              document: {
                id: `doc-gf-${Date.now()}`,
                title: campaign?.name || `${project.name} 30-Day Growth Blueprint`,
                category: 'executive_brief',
                markdownContent: markdownDossier,
                author: 'Vesper & Sterling (Growth Factory)',
                createdAt: new Date().toLocaleDateString(),
                readTimeMin: 5,
                tags: [project.name, '30-Day Campaign', 'Short-Form Video', 'Lead Attribution'],
              },
              campaign: {
                id: `camp-gf-${Date.now()}`,
                campaignName: campaign?.name || `${project.name} Outreach & Conversion Sequence`,
                targetAudience: project.audience,
                strategy: campaign?.positioning || objective,
                totalContacts: angles.length || 6,
                cadenceSteps: [
                  { day: 1, title: 'Hook & Value Drop', purpose: 'Capture high-intent attention' },
                  { day: 4, title: 'Case Proof & Demo', purpose: 'Overcome skepticism with proof' },
                  { day: 8, title: 'Direct Qualification CTA', purpose: 'Convert into booked call' },
                ],
                emails: angles.map((a: any, i: number) => ({
                  id: `gf-email-${i + 1}`,
                  recipientName: `${project.audience.split(',')[0]} Lead #${i + 1}`,
                  recipientRole: a.title || `Decision Maker`,
                  company: `${project.name} Target Segment`,
                  email: `prospect${i + 1}@${project.id}.ng`,
                  subject: a.title ? `${project.name}: ${a.title}` : `Quick question re: ${project.offer}`,
                  body: `Hi there,\n\n${a.hook}\n\nWe built ${project.name} (${project.offer}) specifically for ${project.audience.toLowerCase()} looking to achieve: ${objective}\n\n${a.cta}\n\nBest regards,\nAgentStation Growth Squad`,
                  callToAction: a.cta || 'Book a 10-minute walkthrough',
                  stepIndex: (i % 3) + 1,
                  status: 'ready' as const,
                  followUpCadence: `Angle #${i + 1} (${a.format || '9:16 Video + DM'})`,
                })),
              },
            };

            fetch('/api/files/save-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: campaignFiles, missionId: newMissionId }),
            }).catch(() => {});

            setMission(mountedMission);
            updateHistoryWithMission(mountedMission);
            setIsHomePromptMode(false);
            setComputerTab(targetTab);
            setMobileActiveView('workstation');
            showToast(`Mounted "${project.name}" campaign into Dossier, Spreadsheet, Outreach & Video Studio!`);
          }}
        />
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        missions={missionHistory}
        onSelectMission={handleSelectMission}
        onNewTask={() => setIsHomePromptMode(true)}
        onExecutePrompt={handleExecutePrompt}
        onSelectTab={(tab) => {
          setComputerTab(tab);
          setMobileActiveView('workstation');
          setIsHomePromptMode(false);
        }}
        onOpenAutonomy={() => setIsAutonomyOpen(true)}
        onOpenGrowthFactory={() => setIsGrowthFactoryOpen(true)}
        onOpenGradientStudio={() => setIsGradientStudioOpen(true)}
        onOpenFullStack={() => setIsFullStackModalOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenOllama={() => setIsOllamaModalOpen(true)}
      />

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


export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const handleBootstrapLogin = async () => {
    setAuthError(null);
    if (!bootstrapToken.trim()) {
      setAuthError('Enter the administrator bootstrap token.');
      return;
    }
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bootstrapToken: bootstrapToken.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      setAuthenticated(true);
      setBootstrapToken('');
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed');
    }
  };

  if (authChecking) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center text-sm">Securing AgentStation…</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
            <div><h1 className="text-lg font-bold">AgentStation</h1><p className="text-xs text-slate-400">Secure operator sign-in</p></div>
          </div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Bootstrap token</label>
          <input
            type="password"
            value={bootstrapToken}
            onChange={(e) => setBootstrapToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleBootstrapLogin(); }}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-blue-500"
            placeholder="Enter your server-issued bootstrap token"
          />
          {authError && <p className="mt-3 text-xs text-red-400">{authError}</p>}
          <button type="button" onClick={() => void handleBootstrapLogin()} className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold">Sign in securely</button>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">The token is sent only to the server. It is never stored in browser storage or returned to the page.</p>
        </div>
      </div>
    );
  }

  return <AgentStationApp />;
}
