import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Play,
  Terminal,
  FileArchive,
  CheckCircle,
  FolderGit2,
} from 'lucide-react';
import JSZip from 'jszip';
import { WorkspaceFile, TestExecutionResult } from '../types';

interface CodeWorkspaceProps {
  files: WorkspaceFile[];
  execution: TestExecutionResult;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  files,
  execution,
  onRunCommand,
  isRunningCommand,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal'>('editor');

  const currentFile = files[activeFileIndex] || files[0];

  const handleCopyCode = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.path || file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-station-codebase.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim() || isRunningCommand) return;
    onRunCommand(customCommand.trim());
    setActiveTab('terminal');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* File Navigation Tabs */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-3 pt-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {files.map((file, idx) => {
            const isActive = idx === activeFileIndex;
            return (
              <button
                key={file.name}
                onClick={() => {
                  setActiveFileIndex(idx);
                  setActiveTab('editor');
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition border-t border-x ${
                  isActive
                    ? 'bg-slate-900 border-slate-700 text-blue-400 font-semibold shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 pb-1 shrink-0">
          <button
            onClick={() => setActiveTab(activeTab === 'editor' ? 'terminal' : 'editor')}
            className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1 font-mono transition ${
              activeTab === 'terminal'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Terminal</span>
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy current file"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadFile}
            title="Download current file"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownloadZip}
            title="Download all workspace files as .ZIP"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600/90 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>
      </div>

      {/* Editor / Terminal View */}
      {activeTab === 'editor' && currentFile && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
          {/* File Meta Subheader */}
          <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <FolderGit2 className="w-3 h-3 text-slate-500" />
              <span>{currentFile.path}</span>
            </span>
            <span>{currentFile.content.split('\n').length} lines</span>
          </div>

          {/* Syntax Code View with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 select-all scrollbar-thin">
            <pre className="table w-full">
              {currentFile.content.split('\n').map((line, i) => (
                <div key={i} className="table-row leading-5 hover:bg-slate-800/30">
                  <span className="table-cell pr-4 text-slate-600 text-right select-none w-8">
                    {i + 1}
                  </span>
                  <span className="table-cell whitespace-pre font-mono text-slate-300">
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* Terminal View */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-mono text-slate-300 font-bold">DevOps Execution Sandbox</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {execution.testsPassed} Passed
              </span>
              <span>Duration: {execution.durationMs}ms</span>
              <span>Exit Code: {execution.exitCode}</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 space-y-2 scrollbar-thin">
            <div className="text-slate-400 flex items-center gap-2">
              <span className="text-amber-400">$</span>
              <span>{execution.command}</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono">
              {execution.stdout}
            </pre>
          </div>

          {/* Terminal Command Prompt Input */}
          <form
            onSubmit={handleCommandSubmit}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <span className="text-amber-400 font-mono text-xs pl-2">$</span>
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="e.g. pytest -v, python src/task_manager.py list, or docker build"
              disabled={isRunningCommand}
              className="flex-1 bg-slate-950 text-slate-100 text-xs font-mono rounded px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isRunningCommand}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition disabled:opacity-50"
            >
              {isRunningCommand ? (
                <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>Run</span>
            </button>
          </form>
        </div>
      )}

      {/* Footer Quick Run bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">Quick Run:</span>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('pytest -v tests/');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
          >
            pytest -v
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('python src/task_manager.py list');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
          >
            run cli
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('docker build -t agent-station-sandbox .');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
          >
            docker build
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {files.length} files generated in sandbox
        </div>
      </div>
    </div>
  );
};
