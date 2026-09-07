import React, { useState } from 'react';
import {
  Globe,
  Terminal,
  Code2,
  Film,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Copy,
  Check,
  Download,
  FileArchive,
  ShieldCheck,
  Cpu,
  Workflow,
  GitBranch,
} from 'lucide-react';
import { WorkspaceFile, TestExecutionResult, VideoProject, CiStatusInfo } from '../types';
import { CodeWorkspace } from './CodeWorkspace';
import { VideoStudio } from './VideoStudio';
import { PipelineStatus } from './PipelineStatus';

interface ManusComputerProps {
  files: WorkspaceFile[];
  execution?: TestExecutionResult;
  video?: VideoProject | null;
  onUpdateVideo?: (updated: VideoProject) => void;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
  streamingTerminalOutput?: string;
  isStreamingTerminal?: boolean;
  isWsConnected?: boolean;
  onClearTerminal?: () => void;
  onUpdateFile?: (fileIndex: number, newContent: string) => void;
  onAddFile?: (newFile: WorkspaceFile) => void;
  onDeleteFile?: (fileIndex: number) => void;
  onPushToGitHub?: () => void;
  activeTab?: 'browser' | 'terminal' | 'code' | 'video' | 'pipeline';
  onTabChange?: (tab: 'browser' | 'terminal' | 'code' | 'video' | 'pipeline') => void;
  missionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  ciStatus?: CiStatusInfo | null;
  gitBranch?: string;
  gitCommitMessage?: string;
}

export const ManusComputer: React.FC<ManusComputerProps> = ({
  files,
  execution,
  video,
  onUpdateVideo,
  onRunCommand,
  isRunningCommand,
  streamingTerminalOutput,
  isStreamingTerminal = false,
  isWsConnected = false,
  onClearTerminal,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onPushToGitHub,
  activeTab = 'browser',
  onTabChange,
  missionStatus = 'completed',
  ciStatus,
  gitBranch = 'main',
  gitCommitMessage,
}) => {
  const [internalTab, setInternalTab] = useState<'browser' | 'terminal' | 'code' | 'video' | 'pipeline'>(activeTab);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPipelineRibbonOpen, setIsPipelineRibbonOpen] = useState(true);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [browserUrl, setBrowserUrl] = useState('http://localhost:3000/app');
  const [browserKey, setBrowserKey] = useState(0);

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: 'browser' | 'terminal' | 'code' | 'video' | 'pipeline') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const handleRefresh = () => {
    setBrowserKey((k) => k + 1);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isMaximized
          ? 'fixed inset-4 z-50 rounded-2xl'
          : 'h-full min-h-0'
      }`}
    >
      {/* 1. AgentStation Computer Titlebar */}
      <div className="h-11 px-4 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between shrink-0 select-none">
        {/* Window controls & Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              AgentStation Workstation
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sandbox Active • 1080p
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setTab('browser')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs ${
              currentTab === 'browser'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Browser</span>
          </button>

          <button
            onClick={() => setTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs ${
              currentTab === 'terminal'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => setTab('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs ${
              currentTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={() => setTab('video')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs ${
              currentTab === 'video'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>

          <button
            onClick={() => setTab('pipeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium text-xs ${
              currentTab === 'pipeline'
                ? 'bg-emerald-600 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>CI/CD</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>

        {/* Window actions */}
        <div className="flex items-center gap-2">
          {currentTab !== 'pipeline' && (
            <button
              onClick={() => setIsPipelineRibbonOpen(!isPipelineRibbonOpen)}
              title={isPipelineRibbonOpen ? 'Hide Pipeline Timeline' : 'Show Pipeline Timeline'}
              className={`px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition ${
                isPipelineRibbonOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Timeline</span>
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Viewport' : 'Maximize Computer'}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
        {/* Interactive CI/CD Timeline Ribbon across tabs */}
        {isPipelineRibbonOpen && currentTab !== 'pipeline' && (
          <div className="px-3 pt-2 pb-1 bg-slate-950 border-b border-slate-800/70 shrink-0">
            <PipelineStatus
              missionStatus={missionStatus}
              execution={execution}
              ciStatus={ciStatus}
              gitBranch={gitBranch}
              gitCommitMessage={gitCommitMessage}
              onRunCommand={onRunCommand}
              isRunningCommand={isRunningCommand}
              variant="compact"
            />
          </div>
        )}
        {/* TAB 1: BROWSER OPERATOR */}
        {currentTab === 'browser' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Virtual Browser Chrome / Address Bar */}
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={handleRefresh}
                  title="Reload Application"
                  className="p-1 rounded hover:bg-slate-800 hover:text-white transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Address bar */}
              <div className="flex-1 max-w-xl flex items-center px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs">
                <Globe className="w-3 h-3 text-emerald-400 mr-2 shrink-0" />
                <span className="truncate">{browserUrl}</span>
                <span className="ml-auto text-[10px] text-emerald-400 font-bold">200 OK</span>
              </div>

              {/* Viewport Toggles */}
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1 rounded transition ${
                    viewportMode === 'desktop' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'
                  }`}
                  title="Desktop 1280px"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1 rounded transition ${
                    viewportMode === 'mobile' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'
                  }`}
                  title="Mobile 390px"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Embedded Live Preview Canvas via CodeWorkspace */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CodeWorkspace
                key={browserKey}
                files={files}
                execution={execution}
                video={video}
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
        )}

        {/* TAB 2: TERMINAL SANDBOX */}
        {currentTab === 'terminal' && (
          <div className="flex-1 flex flex-col min-h-0">
            <CodeWorkspace
              files={files}
              execution={execution}
              video={video}
              onUpdateVideo={onUpdateVideo}
              defaultTab="terminal"
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
        )}

        {/* TAB 3: CODE WORKSPACE */}
        {currentTab === 'code' && (
          <div className="flex-1 flex flex-col min-h-0">
            <CodeWorkspace
              files={files}
              execution={execution}
              video={video}
              onUpdateVideo={onUpdateVideo}
              defaultTab="editor"
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
        )}

        {/* TAB 4: VIDEO PRODUCTION STUDIO */}
        {currentTab === 'video' && (
          <div className="flex-1 flex flex-col min-h-0">
            <VideoStudio video={video} onUpdateVideo={onUpdateVideo} />
          </div>
        )}

        {/* TAB 5: CONTINUOUS INTEGRATION & DELIVERY (CI/CD) PIPELINE */}
        {currentTab === 'pipeline' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-4 bg-slate-950">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-emerald-400" />
                    <span>Automated CI/CD Pipeline & GitHub Sync</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Interactive stage timeline visualizing Lint, Transpile & Bundle, Sandbox Unit Testing, and Edge Deployment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPushToGitHub?.()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition border border-slate-700/80"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sync GitHub</span>
                  </button>
                </div>
              </div>

              <PipelineStatus
                missionStatus={missionStatus}
                execution={execution}
                ciStatus={ciStatus}
                gitBranch={gitBranch}
                gitCommitMessage={gitCommitMessage}
                onRunCommand={onRunCommand}
                isRunningCommand={isRunningCommand}
                variant="expanded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
