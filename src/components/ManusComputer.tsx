import React, { useEffect, useState } from 'react';
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
  Table,
  FileText,
  Send,
  MoreHorizontal,
} from 'lucide-react';
import { WorkspaceFile, TestExecutionResult, VideoProject, CiStatusInfo, SpreadsheetDataset, DocumentArtifact, OutreachCampaign } from '../types';
import { CodeWorkspace } from './CodeWorkspace';
import { VideoStudio } from './VideoStudio';
import { PipelineStatus } from './PipelineStatus';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { DocumentViewer } from './DocumentViewer';
import { OutreachCampaignViewer } from './OutreachCampaignViewer';

export type WorkstationTab = 'browser' | 'terminal' | 'code' | 'video' | 'pipeline' | 'data' | 'report' | 'outreach';

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
  activeTab?: WorkstationTab;
  onTabChange?: (tab: WorkstationTab) => void;
  missionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  ciStatus?: CiStatusInfo | null;
  gitBranch?: string;
  gitCommitMessage?: string;
  spreadsheet?: SpreadsheetDataset;
  document?: DocumentArtifact;
  campaign?: OutreachCampaign;
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
  spreadsheet,
  document,
  campaign,
}) => {
  const [internalTab, setInternalTab] = useState<WorkstationTab>(activeTab);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPipelineRibbonOpen, setIsPipelineRibbonOpen] = useState(true);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [browserUrl, setBrowserUrl] = useState('http://localhost:3000/app');
  const [browserKey, setBrowserKey] = useState(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const secondaryTabs: WorkstationTab[] = ['video', 'pipeline', 'data', 'report', 'outreach'];


  useEffect(() => {
    if (secondaryTabs.includes(currentTab)) setIsToolsOpen(true);
  }, [currentTab]);

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: WorkstationTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const handleRefresh = () => {
    setBrowserKey((k) => k + 1);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 border border-slate-800/90 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isMaximized
          ? 'fixed inset-4 z-50 rounded-2xl'
          : 'h-full min-h-0'
      }`}
    >
      {/* 1. AgentStation Computer Titlebar */}
      <div className="min-h-11 px-2.5 sm:px-4 py-1.5 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0 select-none">
        {/* Window controls & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5 truncate">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              AgentStation Workstation
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sandbox Active • 1080p
            </span>
          </div>
        </div>

        {/* Primary workspace navigation. Specialized outputs stay available without competing with the core task surface. */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs overflow-x-auto max-w-[62vw] sm:max-w-none scrollbar-none" aria-label="Primary workstation views">
            <button type="button" onClick={() => setTab('browser')} aria-pressed={currentTab === 'browser'} className={`flex items-center gap-1.5 min-h-9 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${currentTab === 'browser' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Globe className="w-3.5 h-3.5" /><span className="hidden sm:inline">Browser</span>
            </button>
            <button type="button" onClick={() => setTab('code')} aria-pressed={currentTab === 'code'} className={`flex items-center gap-1.5 min-h-9 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${currentTab === 'code' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Code2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Code</span>
            </button>
            <button type="button" onClick={() => setTab('terminal')} aria-pressed={currentTab === 'terminal'} className={`flex items-center gap-1.5 min-h-9 px-2.5 py-1 rounded-md transition font-medium text-xs whitespace-nowrap ${currentTab === 'terminal' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Terminal className="w-3.5 h-3.5" /><span className="hidden sm:inline">Terminal</span>
            </button>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsToolsOpen((open) => !open)}
              aria-expanded={isToolsOpen}
              aria-haspopup="menu"
              aria-label="Open workstation tools"
              className={`flex items-center gap-1.5 min-h-9 px-2.5 rounded-md border text-xs font-semibold transition ${secondaryTabs.includes(currentTab) || isToolsOpen ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tools</span>
              {secondaryTabs.includes(currentTab) && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>

            {isToolsOpen && (
              <div role="menu" aria-label="Specialized workstation tools" className="absolute right-0 top-full mt-2 z-50 w-56 p-1.5 rounded-xl border border-slate-700 bg-slate-900/98 shadow-2xl shadow-black/60 backdrop-blur-xl">
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">Specialized tools</div>
                {video && <button type="button" role="menuitem" onClick={() => { setTab('video'); setIsToolsOpen(false); }} className={`w-full flex items-center gap-2 min-h-10 px-2 rounded-lg text-xs text-left transition ${currentTab === 'video' ? 'bg-purple-600/20 text-purple-200' : 'text-slate-300 hover:bg-slate-800'}`}><Film className="w-3.5 h-3.5" /> Video Studio</button>}
                {spreadsheet && <button type="button" role="menuitem" onClick={() => { setTab('data'); setIsToolsOpen(false); }} className={`w-full flex items-center gap-2 min-h-10 px-2 rounded-lg text-xs text-left transition ${currentTab === 'data' ? 'bg-teal-600/20 text-teal-200' : 'text-slate-300 hover:bg-slate-800'}`}><Table className="w-3.5 h-3.5" /> Spreadsheet <span className="ml-auto text-[10px] text-slate-500">{spreadsheet.rows?.length || 20}</span></button>}
                {document && <button type="button" role="menuitem" onClick={() => { setTab('report'); setIsToolsOpen(false); }} className={`w-full flex items-center gap-2 min-h-10 px-2 rounded-lg text-xs text-left transition ${currentTab === 'report' ? 'bg-cyan-600/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'}`}><FileText className="w-3.5 h-3.5" /> Dossier</button>}
                {campaign && <button type="button" role="menuitem" onClick={() => { setTab('outreach'); setIsToolsOpen(false); }} className={`w-full flex items-center gap-2 min-h-10 px-2 rounded-lg text-xs text-left transition ${currentTab === 'outreach' ? 'bg-orange-600/20 text-orange-200' : 'text-slate-300 hover:bg-slate-800'}`}><Send className="w-3.5 h-3.5" /> Campaign</button>}
                <button type="button" role="menuitem" onClick={() => { setTab('pipeline'); setIsToolsOpen(false); }} className={`w-full flex items-center gap-2 min-h-10 px-2 rounded-lg text-xs text-left transition ${currentTab === 'pipeline' ? 'bg-emerald-600/20 text-emerald-200' : 'text-slate-300 hover:bg-slate-800'}`}><Workflow className="w-3.5 h-3.5" /> CI/CD Pipeline <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" /></button>
              </div>
            )}
          </div>
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
            aria-label={isMaximized ? 'Restore workstation' : 'Maximize workstation'}
            className="min-w-9 min-h-9 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
        {/* Interactive CI/CD Timeline Ribbon across tabs */}
        {isPipelineRibbonOpen && currentTab !== 'pipeline' && (
          <div className="px-2 sm:px-3 pt-1.5 pb-1 bg-slate-950 border-b border-slate-800/70 shrink-0">
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
        {/* TAB 0A: INTERACTIVE SPREADSHEET DATASET */}
        {currentTab === 'data' && (
          <div className="flex-1 flex flex-col min-h-0">
            <SpreadsheetViewer dataset={spreadsheet} />
          </div>
        )}

        {/* TAB 0B: EXECUTIVE RESEARCH DOSSIER */}
        {currentTab === 'report' && (
          <div className="flex-1 flex flex-col min-h-0">
            <DocumentViewer document={document} />
          </div>
        )}

        {/* TAB 0C: PERSONALIZED OUTREACH CAMPAIGN */}
        {currentTab === 'outreach' && (
          <div className="flex-1 flex flex-col min-h-0">
            <OutreachCampaignViewer campaign={campaign} />
          </div>
        )}

        {/* TAB 1: BROWSER OPERATOR */}
        {currentTab === 'browser' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Virtual Browser Chrome / Address Bar */}
            <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
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
