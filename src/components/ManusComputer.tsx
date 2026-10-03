import React, { useState } from 'react';
import {
  Globe,
  Terminal,
  Code2,
  Film,
  Maximize2,
  Minimize2,
  RotateCcw,
  Monitor,
  Smartphone,
  Cpu,
  Workflow,
  GitBranch,
  Table,
  FileText,
  Send,
} from 'lucide-react';
import {
  WorkspaceFile,
  TestExecutionResult,
  VideoProject,
  CiStatusInfo,
  SpreadsheetDataset,
  DocumentArtifact,
  OutreachCampaign,
} from '../types';
import { CodeWorkspace } from './CodeWorkspace';
import { VideoStudio } from './VideoStudio';
import { PipelineStatus } from './PipelineStatus';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { DocumentViewer } from './DocumentViewer';
import { OutreachCampaignViewer } from './OutreachCampaignViewer';

export type WorkstationTab =
  | 'browser'
  | 'terminal'
  | 'code'
  | 'video'
  | 'pipeline'
  | 'data'
  | 'report'
  | 'outreach';

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
  missionStatus?: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  ciStatus?: CiStatusInfo | null;
  gitBranch?: string;
  gitCommitMessage?: string;
  spreadsheet?: SpreadsheetDataset;
  document?: DocumentArtifact;
  campaign?: OutreachCampaign;
  selectedFilePath?: string | null;
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
  selectedFilePath,
}) => {
  const [internalTab, setInternalTab] = useState<WorkstationTab>(activeTab);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPipelineRibbonOpen, setIsPipelineRibbonOpen] = useState(false);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [browserUrl] = useState('https://sandbox.agentstation.local/app');
  const [browserKey, setBrowserKey] = useState(0);

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
        isMaximized ? 'fixed inset-4 z-50 rounded-2xl' : 'h-full min-h-0'
      }`}
    >
      {/* 1. AgentStation Workstation Titlebar (Jakob's Law: Familiar IDE/Browser Chrome + Visible Tab Strip) */}
      <div className="px-2.5 sm:px-4 py-2 bg-slate-900/95 border-b border-slate-800/90 flex flex-col gap-2 shrink-0 select-none">
        <div className="flex items-center justify-between gap-2">
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
              <span
                role="status"
                aria-live="polite"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                  isWsConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {isWsConnected ? 'Sandbox Live' : 'Sandbox Ready'}
              </span>
            </div>
          </div>

          {/* Right Window Actions */}
          <div className="flex items-center gap-1.5">
            {currentTab !== 'pipeline' && (
              <button
                onClick={() => setIsPipelineRibbonOpen(!isPipelineRibbonOpen)}
                title={isPipelineRibbonOpen ? 'Hide CI/CD Status Bar' : 'Show CI/CD Status Bar'}
                className={`px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition ${
                  isPipelineRibbonOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">CI/CD Bar</span>
              </button>
            )}

            {onPushToGitHub && (
              <button
                onClick={onPushToGitHub}
                title="Sync workspace to GitHub"
                className="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline text-[11px]">{gitBranch}</span>
              </button>
            )}

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Restore Viewport' : 'Maximize Workstation'}
              aria-label={isMaximized ? 'Restore workstation' : 'Maximize workstation'}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Unified Discoverable Tab Bar (Jakob's Law: VS Code / Cursor / Linear Tab Strip) */}
        <div
          className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5"
          role="tablist"
          aria-label="Workstation Deliverable Tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'browser'}
            onClick={() => setTab('browser')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              currentTab === 'browser'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>App Preview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'code'}
            onClick={() => setTab('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              currentTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code IDE</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/25">
              {files.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'terminal'}
            onClick={() => setTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              currentTab === 'terminal'
                ? 'bg-amber-600 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
            {execution?.testsPassed ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                ✓{execution.testsPassed}
              </span>
            ) : null}
          </button>

          {spreadsheet && (
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'data'}
              onClick={() => setTab('data')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                currentTab === 'data'
                  ? 'bg-teal-600 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Spreadsheet</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {spreadsheet.rows?.length || 20}
              </span>
            </button>
          )}

          {document && (
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'report'}
              onClick={() => setTab('report')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                currentTab === 'report'
                  ? 'bg-cyan-600 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dossier</span>
            </button>
          )}

          {campaign && (
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'outreach'}
              onClick={() => setTab('outreach')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                currentTab === 'outreach'
                  ? 'bg-orange-600 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Outreach</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {campaign.emails?.length || 0}
              </span>
            </button>
          )}

          {video && (
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'video'}
              onClick={() => setTab('video')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                currentTab === 'video'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Studio</span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'pipeline'}
            onClick={() => setTab('pipeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              currentTab === 'pipeline'
                ? 'bg-emerald-600 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>CI/CD</span>
          </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
        {/* Interactive CI/CD Timeline Ribbon across tabs (collapsible) */}
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
                  aria-label="Reload application preview"
                  title="Reload Application"
                  className="p-1.5 rounded hover:bg-slate-800 hover:text-white transition"
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

              {/* Viewport Toggles (Responsive Device Preview) */}
              <div className="flex items-center gap-1 text-slate-400 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition ${
                    viewportMode === 'desktop' ? 'bg-slate-800 text-white font-semibold' : 'hover:text-slate-200'
                  }`}
                  title="Desktop Viewport (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition ${
                    viewportMode === 'mobile' ? 'bg-slate-800 text-white font-semibold' : 'hover:text-slate-200'
                  }`}
                  title="Mobile Viewport (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Embedded Live Preview Canvas via CodeWorkspace */}
            <div
              className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                viewportMode === 'mobile' ? 'items-center bg-slate-950 p-3' : ''
              }`}
            >
              <div
                className={`flex-1 flex flex-col min-h-0 w-full transition-all duration-300 ${
                  viewportMode === 'mobile'
                    ? 'max-w-[400px] rounded-3xl border-4 border-slate-800 overflow-hidden shadow-2xl'
                    : ''
                }`}
              >
                <CodeWorkspace
                  key={browserKey}
                  files={files}
                  execution={execution!}
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
          </div>
        )}

        {/* TAB 2: TERMINAL SANDBOX */}
        {currentTab === 'terminal' && (
          <div className="flex-1 flex flex-col min-h-0">
            <CodeWorkspace
              files={files}
              execution={execution!}
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
              execution={execution!}
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
              selectedFilePath={selectedFilePath}
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
