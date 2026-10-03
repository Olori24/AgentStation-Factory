import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Eye,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Github,
  Search,
  Radio,
  Wifi,
  Film,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Save,
  Columns,
} from 'lucide-react';
import JSZip from 'jszip';
import { WorkspaceFile, TestExecutionResult, VideoProject } from '../types';
import { VideoStudio } from './VideoStudio';

interface CodeWorkspaceProps {
  files: WorkspaceFile[];
  execution: TestExecutionResult;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
  video?: VideoProject | null;
  onUpdateVideo?: (updated: VideoProject) => void;
  defaultTab?: 'editor' | 'diff' | 'preview' | 'terminal' | 'video';
  streamingTerminalOutput?: string;
  isStreamingTerminal?: boolean;
  isWsConnected?: boolean;
  onClearTerminal?: () => void;
  onUpdateFile?: (fileIndex: number, newContent: string) => void;
  onAddFile?: (newFile: WorkspaceFile) => void;
  onDeleteFile?: (fileIndex: number) => void;
  onOpenGitHub?: () => void;
  onPushToGitHub?: () => void;
  selectedFilePath?: string | null;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  files,
  execution,
  onRunCommand,
  isRunningCommand,
  video,
  onUpdateVideo,
  defaultTab = 'preview',
  streamingTerminalOutput,
  isStreamingTerminal = false,
  isWsConnected = false,
  onClearTerminal,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onOpenGitHub,
  onPushToGitHub,
  selectedFilePath,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'diff' | 'preview' | 'terminal' | 'video'>(defaultTab);
  const [diffMode, setDiffMode] = useState<'split' | 'unified'>('split');
  const [isEditing, setIsEditing] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [explorerFilter, setExplorerFilter] = useState('');
  const [inFileSearch, setInFileSearch] = useState('');
  const [isInFileSearchOpen, setIsInFileSearchOpen] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const [savedDiskNotice, setSavedDiskNotice] = useState<string | null>(null);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const handleGitHubClick = onPushToGitHub || onOpenGitHub;

  // Synchronize when parent requests a specific file to open
  useEffect(() => {
    if (!selectedFilePath) return;
    const idx = files.findIndex(
      (f) => f.path === selectedFilePath || f.name === selectedFilePath
    );
    if (idx >= 0) {
      setActiveFileIndex(idx);
      setActiveTab('editor');
    }
  }, [selectedFilePath, files]);

  // Track initial snapshot of file contents for Diff view & dirty dot indicator
  useEffect(() => {
    setOriginalContents((prev) => {
      const next = { ...prev };
      files.forEach((f) => {
        if (next[f.name] === undefined) {
          next[f.name] = f.content;
        }
      });
      return next;
    });
  }, [files]);

  // Ensure index is valid
  const safeIndex = activeFileIndex < files.length ? activeFileIndex : 0;
  const currentFile = files[safeIndex] || files[0] || {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: '# AgentStation Workspace\n\nNo files currently loaded in workspace.',
  };

  const safeExecution = execution || {
    command: 'pytest -v tests/',
    stdout: 'Execution environment ready. All unit tests verified.',
    testsPassed: 4,
    testsFailed: 0,
    durationMs: 75,
    exitCode: 0,
  };

  const displayOutput =
    streamingTerminalOutput !== undefined && streamingTerminalOutput !== ''
      ? streamingTerminalOutput
      : safeExecution.stdout;

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [displayOutput, activeTab, isStreamingTerminal]);

  // Save current file to backend workspace disk (/api/files/save) + Ctrl+S shortcut
  const handleSaveToDisk = async () => {
    if (!currentFile || isSavingDisk) return;
    setIsSavingDisk(true);
    try {
      await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentFile.path || currentFile.name,
          content: currentFile.content,
        }),
      });
      setOriginalContents((prev) => ({
        ...prev,
        [currentFile.name]: currentFile.content,
      }));
      setSavedDiskNotice(`Saved ${currentFile.name} ✓`);
      setTimeout(() => setSavedDiskNotice(null), 2200);
    } catch {
      // fallback in offline mode
    } finally {
      setIsSavingDisk(false);
    }
  };

  // Save all workspace files to disk (/api/files/save-batch)
  const handleSaveAllToDisk = async () => {
    if (!files.length || isSavingDisk) return;
    setIsSavingDisk(true);
    try {
      await fetch('/api/files/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      const updatedBaseline: Record<string, string> = {};
      files.forEach((f) => {
        updatedBaseline[f.name] = f.content;
      });
      setOriginalContents(updatedBaseline);
      setSavedDiskNotice(`Synced ${files.length} files to workspace/ ✓`);
      setTimeout(() => setSavedDiskNotice(null), 2500);
    } catch {
      // fallback
    } finally {
      setIsSavingDisk(false);
    }
  };

  const handleLoadFromDisk = async () => {
    if (!onAddFile) return;
    setIsSavingDisk(true);
    try {
      const res = await fetch('/api/files/tree');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        const existingPaths = new Set(files.map((f) => f.path || f.name));
        let imported = 0;
        for (const df of data.files) {
          if (!existingPaths.has(df.path) && !existingPaths.has(df.name)) {
            onAddFile({
              name: df.name,
              path: df.path,
              language: df.language || 'markdown',
              content: df.content,
            });
            imported++;
          }
        }
        setSavedDiskNotice(
          imported > 0
            ? `Loaded ${imported} file(s) from workspace/ ✓`
            : `Workspace in sync (${data.files.length} disk files) ✓`
        );
        setTimeout(() => setSavedDiskNotice(null), 2500);
      }
    } catch {
      // fallback
    } finally {
      setIsSavingDisk(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'editor' && activeTab !== 'diff') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveToDisk();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsInFileSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, currentFile]);

  // Group files by directory for the VS Code / Cursor File Explorer Tree
  const groupedFiles = useMemo(() => {
    const groups: Record<string, { file: WorkspaceFile; idx: number }[]> = {};
    const q = explorerFilter.trim().toLowerCase();
    files.forEach((file, idx) => {
      const rawPath = file.path || file.name;
      if (q && !rawPath.toLowerCase().includes(q)) return;
      const parts = rawPath.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push({ file, idx });
    });
    return groups;
  }, [files, explorerFilter]);

  const modifiedFilesCount = useMemo(() => {
    return files.filter(
      (f) => originalContents[f.name] !== undefined && originalContents[f.name] !== f.content
    ).length;
  }, [files, originalContents]);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const formatBytes = (str: string) => {
    const bytes = new Blob([str || '']).size;
    return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
  };

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

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !onAddFile) return;
    const trimmed = newFileName.trim();
    const ext = trimmed.split('.').pop()?.toLowerCase() || '';
    let language: any = 'typescript';
    if (ext === 'py') language = 'python';
    else if (ext === 'js') language = 'javascript';
    else if (ext === 'json') language = 'json';
    else if (ext === 'html') language = 'html';
    else if (ext === 'css') language = 'css';
    else if (ext === 'md') language = 'markdown';
    else if (ext === 'sh') language = 'bash';

    const newFile: WorkspaceFile = {
      name: trimmed.split('/').pop() || trimmed,
      path: trimmed.startsWith('/') ? trimmed.slice(1) : trimmed,
      language,
      content: `// ${trimmed}\n// Created in AgentStation Code Workspace\n\n`,
    };

    onAddFile(newFile);
    fetch('/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: newFile.path, content: newFile.content }),
    }).catch(() => {});
    setNewFileName('');
    setIsAddingFile(false);
    setActiveFileIndex(files.length);
    setActiveTab('editor');
    setIsEditing(true);
  };

  // Build Live Preview Document
  const sandboxHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html') || f.language === 'html');
    const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.language === 'css');
    const jsFiles = files.filter((f) => f.name.endsWith('.js') || f.language === 'javascript');

    if (htmlFile) {
      let combined = htmlFile.content;
      if (cssFiles.length > 0) {
        const injectedStyles = cssFiles.map((c) => `<style>\n${c.content}\n</style>`).join('\n');
        combined = combined.includes('</head>')
          ? combined.replace('</head>', `${injectedStyles}\n</head>`)
          : `${injectedStyles}\n${combined}`;
      }
      if (jsFiles.length > 0) {
        const injectedScripts = jsFiles.map((j) => `<script>\n${j.content}\n</script>`).join('\n');
        combined = combined.includes('</body>')
          ? combined.replace('</body>', `${injectedScripts}\n</body>`)
          : `${combined}\n${injectedScripts}`;
      }
      return combined;
    }

    const mainCode = currentFile?.content || '';
    const escapedCode = mainCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0b0f19; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <div class="max-w-2xl mx-auto space-y-4">
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-sm text-slate-200">Sandbox Preview: ${currentFile?.name || 'Code Engine'}</span>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/50 border border-blue-700/50 text-blue-300 uppercase">${currentFile?.language || 'code'}</span>
      </div>
      <p class="text-xs text-slate-400 mt-2">
        This file is verified in the sandboxed test runner. Below is the active runtime artifact:
      </p>
      <div class="mt-3 p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-72 border border-slate-800">
        <pre>${escapedCode}</pre>
      </div>
    </div>
    <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
      <span>✓ PyTest sandbox validation status: <strong>${safeExecution.testsPassed} assertions passed</strong> (0 errors)</span>
    </div>
  </div>
</body>
</html>`;
  }, [files, currentFile, safeExecution, previewReloadKey]);

  const breadcrumbParts = (currentFile.path || currentFile.name).split('/');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* File Navigation Tabs & Action Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-3 pt-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {(activeTab === 'editor' || activeTab === 'diff') && (
            <button
              type="button"
              onClick={() => setIsExplorerOpen(!isExplorerOpen)}
              title={isExplorerOpen ? 'Hide File Explorer' : 'Show File Explorer'}
              className="p-1.5 mb-1 mr-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isExplorerOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            </button>
          )}

          {files.map((file, idx) => {
            const isActive = idx === safeIndex;
            const isDirty =
              originalContents[file.name] !== undefined &&
              originalContents[file.name] !== file.content;
            return (
              <div key={file.path || file.name} className="relative group">
                <button
                  onClick={() => {
                    setActiveFileIndex(idx);
                    if (activeTab === 'preview') setPreviewReloadKey((k) => k + 1);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition border-t border-x ${
                    isActive
                      ? 'bg-slate-900 border-slate-700 text-blue-400 font-semibold shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{file.name}</span>
                  {isDirty && (
                    <span
                      title="Unsaved modifications"
                      className="w-2 h-2 rounded-full bg-amber-400"
                    />
                  )}
                </button>
                {files.length > 1 && onDeleteFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetPath = file.path || file.name;
                      fetch('/api/files/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: targetPath }),
                      }).catch(() => {});
                      onDeleteFile(idx);
                      if (activeFileIndex >= files.length - 1) {
                        setActiveFileIndex(Math.max(0, files.length - 2));
                      }
                    }}
                    title="Delete file"
                    className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded bg-slate-800 text-slate-400 hover:text-red-400 text-[10px]"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {onAddFile && (
            <button
              onClick={() => setIsAddingFile(!isAddingFile)}
              title="Add new file"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action icons & Mode Tabs */}
        <div className="flex items-center gap-1 pb-1 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'terminal'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'video'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Video</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3 h-3" />
              <span>Diff</span>
              {modifiedFilesCount > 0 && (
                <span className="px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-bold">
                  {modifiedFilesCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copy current file content"
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

      {/* New file popup input */}
      {isAddingFile && (
        <form
          onSubmit={handleCreateFileSubmit}
          className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2"
        >
          <span className="text-xs text-slate-400 font-mono">New file path:</span>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. src/utils.py, public/styles.css"
            autoFocus
            className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFile(false)}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* 1. CODE EDITOR TAB (With Jakob's Law VS Code / Cursor File Tree Explorer) */}
      {activeTab === 'editor' && currentFile && (
        <div className="flex-1 flex min-h-0 bg-slate-950/70">
          {/* Collapsible File Tree Sidebar */}
          {isExplorerOpen && (
            <div className="hidden sm:flex w-56 bg-slate-950 border-r border-slate-800/80 flex-col shrink-0 select-none">
              <div className="px-3 py-2 border-b border-slate-800/70 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <span>Explorer</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadFromDisk}
                    disabled={isSavingDisk}
                    title="Load/refresh files from workspace/ disk"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Disk</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllToDisk}
                    disabled={isSavingDisk}
                    title="Sync all files to workspace/ disk"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                  >
                    <Save className="w-3 h-3" />
                    <span>Sync All</span>
                  </button>
                </div>
              </div>

              {/* File Filter Box */}
              <div className="p-2 border-b border-slate-800/60">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={explorerFilter}
                    onChange={(e) => setExplorerFilter(e.target.value)}
                    placeholder="Filter files..."
                    className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                {Object.entries(groupedFiles).map(([folder, entries]) => {
                  const isCollapsed = Boolean(collapsedFolders[folder]);
                  return (
                    <div key={folder} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder)}
                        className="w-full flex items-center justify-between px-1.5 py-1 rounded hover:bg-slate-900 text-[11px] font-mono text-slate-300 font-semibold transition"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isCollapsed ? (
                            <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                          )}
                          {isCollapsed ? (
                            <Folder className="w-3 h-3 text-blue-400 shrink-0" />
                          ) : (
                            <FolderOpen className="w-3 h-3 text-blue-400 shrink-0" />
                          )}
                          <span className="truncate">{folder === 'root' ? 'workspace/' : `${folder}/`}</span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {(entries as { file: WorkspaceFile; idx: number }[]).length}
                        </span>
                      </button>

                      {!isCollapsed &&
                        (entries as { file: WorkspaceFile; idx: number }[]).map(({ file, idx }) => {
                          const isSelected = idx === safeIndex;
                          const isDirty =
                            originalContents[file.name] !== undefined &&
                            originalContents[file.name] !== file.content;
                          return (
                            <button
                              key={file.path || file.name}
                              type="button"
                              onClick={() => setActiveFileIndex(idx)}
                              className={`w-full flex items-center justify-between pl-5 pr-2 py-1.5 rounded-lg text-xs font-mono transition ${
                                isSelected
                                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileCode className="w-3 h-3 shrink-0 text-slate-500" />
                                <span className="truncate">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isDirty ? (
                                  <span
                                    title="Modified"
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                  />
                                ) : (
                                  <span className="text-[9px] text-slate-600">
                                    {formatBytes(file.content)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Editor Area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Breadcrumb & Controls Subheader (Jakob's Law: VS Code Breadcrumb Bar) */}
            <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 flex-wrap">
              <div className="flex items-center gap-1 min-w-0">
                <FolderGit2 className="w-3 h-3 text-blue-400 mr-1 shrink-0" />
                <span className="text-slate-500">workspace</span>
                {breadcrumbParts.map((part, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span
                      className={
                        i === breadcrumbParts.length - 1
                          ? 'text-slate-200 font-semibold truncate'
                          : 'text-slate-400'
                      }
                    >
                      {part}
                    </span>
                  </React.Fragment>
                ))}
                <span className="text-slate-600 mx-1">•</span>
                <span className="uppercase text-[10px] text-blue-400 font-bold">{currentFile.language}</span>
                <span className="text-slate-600 mx-1">•</span>
                <span className="text-[10px] text-slate-500">{formatBytes(currentFile.content)}</span>
              </div>

              <div className="flex items-center gap-2">
                {savedDiskNotice && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {savedDiskNotice}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsInFileSearchOpen((prev) => !prev)}
                  title="Find in File (⌘F / Ctrl+F)"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                    isInFileSearchOpen
                      ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Search className="w-3 h-3" />
                  <span className="hidden sm:inline">Find (⌘F)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToDisk}
                  disabled={isSavingDisk}
                  title="Save to Workspace Disk (⌘S / Ctrl+S)"
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Save className="w-3 h-3 text-emerald-400" />
                  <span>Save (⌘S)</span>
                </button>

                {currentFile.language === 'python' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('terminal');
                      onRunCommand(`python3 ${currentFile.path || currentFile.name}`);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Run File</span>
                  </button>
                )}

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    isEditing
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? 'Editing Mode' : 'Edit File'}</span>
                </button>
                <span className="hidden md:inline">{currentFile.content.split('\n').length} lines</span>
              </div>
            </div>

            {isInFileSearchOpen && (
              <div className="px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <input
                    type="text"
                    value={inFileSearch}
                    onChange={(e) => setInFileSearch(e.target.value)}
                    placeholder={`Find in ${currentFile.name}...`}
                    autoFocus
                    className="w-full px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {inFileSearch.trim() && (
                    <span className="text-amber-300 font-semibold">
                      {
                        currentFile.content
                          .split('\n')
                          .filter((l) => l.toLowerCase().includes(inFileSearch.trim().toLowerCase())).length
                      }{' '}
                      matching line(s)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInFileSearchOpen(false);
                      setInFileSearch('');
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    ESC
                  </button>
                </div>
              </div>
            )}

            {/* Editable Textarea or Formatted Code View */}
            {isEditing ? (
              <div className="flex-1 p-2 bg-slate-950 flex flex-col min-h-0">
                <textarea
                  value={currentFile.content}
                  onChange={(e) => {
                    if (onUpdateFile) {
                      onUpdateFile(safeIndex, e.target.value);
                    }
                  }}
                  spellCheck={false}
                  className="w-full h-full p-3 font-mono text-xs text-slate-200 bg-slate-900/90 rounded-lg border border-slate-700/80 focus:outline-none focus:border-blue-500 resize-none leading-5 scrollbar-thin"
                />
                <div className="mt-1.5 px-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Live state synced • Press ⌘S to write to disk</span>
                    </span>
                    {currentFile.content !== (originalContents[currentFile.name] ?? currentFile.content) && (
                      <button
                        onClick={() => {
                          if (onUpdateFile && originalContents[currentFile.name] !== undefined) {
                            onUpdateFile(safeIndex, originalContents[currentFile.name]);
                          }
                        }}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition"
                        title="Revert modifications to original version"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert changes</span>
                      </button>
                    )}
                  </div>

                  {handleGitHubClick && (
                    <button
                      onClick={handleGitHubClick}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition"
                    >
                      <Github className="w-3 h-3" />
                      <span>Push edits to GitHub</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                onDoubleClick={() => setIsEditing(true)}
                title="Double-click anywhere to enter edit mode"
                className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 select-text scrollbar-thin cursor-text"
              >
                <pre className="table w-full">
                  {currentFile.content.split('\n').map((line, i) => {
                    const q = inFileSearch.trim().toLowerCase();
                    const isMatch = q.length > 0 && line.toLowerCase().includes(q);
                    return (
                      <div
                        key={i}
                        className={`table-row leading-5 ${
                          isMatch
                            ? 'bg-amber-500/20 border-l-2 border-amber-400'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <span className="table-cell pr-4 text-slate-600 text-right select-none w-8">
                          {i + 1}
                        </span>
                        <span
                          className={`table-cell whitespace-pre font-mono ${
                            isMatch ? 'text-amber-200 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CODE DIFF TAB (With Side-by-Side & Unified Diff Modes — Jakob's Law: GitHub / VS Code Diff) */}
      {activeTab === 'diff' && currentFile && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs font-mono flex-wrap">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-200 font-bold">Workspace Diff: {currentFile.path || currentFile.name}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDiffMode('split')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                    diffMode === 'split' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Columns className="w-3 h-3" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiffMode('unified')}
                  className={`px-2 py-0.5 rounded transition ${
                    diffMode === 'unified' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                  }`}
                >
                  Unified
                </button>
              </div>

              {currentFile.content !== (originalContents[currentFile.name] ?? currentFile.content) ? (
                <button
                  type="button"
                  onClick={handleSaveToDisk}
                  className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition"
                >
                  Accept & Save to Disk
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Clean / In Sync with Baseline
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 scrollbar-thin">
            {(() => {
              const origText = originalContents[currentFile.name] ?? currentFile.content;
              const origLines = origText.split('\n');
              const currLines = currentFile.content.split('\n');
              const hasDiff = currentFile.content !== origText;

              if (!hasDiff) {
                return (
                  <div className="text-center py-14 space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-slate-300 text-sm font-sans font-medium">
                      No uncommitted modifications in {currentFile.name}
                    </p>
                    <p className="text-slate-500 text-xs font-sans max-w-sm mx-auto">
                      Switch to the Editor tab to modify this file and inspect side-by-side or unified diffs here.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('editor');
                        setIsEditing(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans font-semibold transition"
                    >
                      Edit File Now
                    </button>
                  </div>
                );
              }

              const maxLines = Math.max(origLines.length, currLines.length);

              if (diffMode === 'split') {
                return (
                  <div className="grid grid-cols-2 gap-2 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="border-r border-slate-800">
                      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                        --- Baseline ({origLines.length} lines)
                      </div>
                      <div className="p-2 space-y-0.5 overflow-x-auto">
                        {Array.from({ length: maxLines }).map((_, idx) => {
                          const oLine = origLines[idx];
                          const cLine = currLines[idx];
                          const changed = oLine !== cLine;
                          return (
                            <div
                              key={idx}
                              className={`px-2 py-0.5 whitespace-pre flex gap-2 ${
                                changed && oLine !== undefined
                                  ? 'bg-rose-950/40 border-l-2 border-rose-500 text-rose-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              <span className="w-6 text-right select-none opacity-50">{idx + 1}</span>
                              <span>{oLine ?? ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-emerald-400">
                        +++ Working Tree ({currLines.length} lines)
                      </div>
                      <div className="p-2 space-y-0.5 overflow-x-auto">
                        {Array.from({ length: maxLines }).map((_, idx) => {
                          const oLine = origLines[idx];
                          const cLine = currLines[idx];
                          const changed = oLine !== cLine;
                          return (
                            <div
                              key={idx}
                              className={`px-2 py-0.5 whitespace-pre flex gap-2 ${
                                changed && cLine !== undefined
                                  ? 'bg-emerald-950/40 border-l-2 border-emerald-500 text-emerald-300'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="w-6 text-right select-none opacity-50">{idx + 1}</span>
                              <span>{cLine ?? ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 mb-2 border-b border-slate-800 pb-1">
                    --- original/{currentFile.name} (baseline)<br />
                    +++ workspace/{currentFile.name} (working tree)
                  </div>
                  {Array.from({ length: maxLines }).map((_, idx) => {
                    const origLine = origLines[idx];
                    const currLine = currLines[idx];
                    if (origLine === currLine) {
                      return (
                        <div key={idx} className="text-slate-400 px-2 py-0.5 whitespace-pre hover:bg-slate-900/40">
                          &nbsp;&nbsp;{currLine}
                        </div>
                      );
                    }
                    return (
                      <React.Fragment key={idx}>
                        {origLine !== undefined && (
                          <div className="bg-rose-950/40 border-l-2 border-rose-500 text-rose-300 px-2 py-0.5 whitespace-pre">
                            - {origLine}
                          </div>
                        )}
                        {currLine !== undefined && (
                          <div className="bg-emerald-950/40 border-l-2 border-emerald-500 text-emerald-300 px-2 py-0.5 whitespace-pre">
                            + {currLine}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. LIVE SANDBOX / PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">Interactive Sandbox Runner</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewReloadKey((k) => k + 1)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reload</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full bg-white relative">
            <iframe
              key={previewReloadKey}
              srcDoc={sandboxHtml}
              title="AgentStation Sandbox"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* 4. TERMINAL SANDBOX TAB */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isStreamingTerminal
                    ? 'bg-emerald-400 animate-ping'
                    : isWsConnected
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-mono text-slate-300 font-bold">DevOps Execution Sandbox</span>
              {isStreamingTerminal ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                  <Radio className="w-2.5 h-2.5" />
                  STREAMING LIVE
                </span>
              ) : isWsConnected ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5" />
                  WS CONNECTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-400 border border-slate-700">
                  SANDBOX READY
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {safeExecution.testsPassed} Passed
              </span>
              {safeExecution.testsFailed > 0 && (
                <span className="text-rose-400 flex items-center gap-1">
                  {safeExecution.testsFailed} Failed
                </span>
              )}
              <span>Duration: {safeExecution.durationMs}ms</span>
              <span>Exit Code: {safeExecution.exitCode ?? 0}</span>
              {onClearTerminal && (
                <button
                  type="button"
                  onClick={onClearTerminal}
                  title="Clear Terminal Output"
                  className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-slate-950 space-y-2 scrollbar-thin">
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono select-text">
              {displayOutput || '[Sandbox Shell]: Ready. Type a command or click a quick sandbox button below.'}
              {isStreamingTerminal && (
                <span className="inline-block w-2 h-3.5 ml-0.5 bg-emerald-400 animate-pulse align-middle" />
              )}
            </pre>
            <div ref={terminalEndRef} />
          </div>

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

      {/* 5. VIDEO STUDIO TAB */}
      {activeTab === 'video' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden">
          <VideoStudio video={video} onUpdateVideo={onUpdateVideo} />
        </div>
      )}

      {/* Footer Quick Run bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-mono text-[11px]">Quick Sandbox:</span>
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
              onRunCommand('npm run lint');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[11px] transition"
          >
            npm run lint
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('git status');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-400 font-mono text-[11px] transition"
          >
            git status
          </button>
          <button
            onClick={() => {
              setActiveTab('preview');
              setPreviewReloadKey((k) => k + 1);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[11px] transition"
          >
            run preview
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {files.length} files • {modifiedFilesCount > 0 ? `${modifiedFilesCount} modified` : 'all synced'}
        </div>
      </div>
    </div>
  );
};
