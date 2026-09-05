import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  GitBranch,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Workflow,
  Box,
  KeyRound,
  Download,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GitCommit,
} from 'lucide-react';
import { GITHUB_REPO_INFO } from '../data/defaults';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitMessage: string;
  currentBranch?: string;
  onBranchChange?: (branch: string) => void;
}

interface GitLiveStatus {
  success: boolean;
  repo: string;
  branch: string;
  branches?: string[];
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  remoteUrl: string;
  isClean: boolean;
  uncommittedFiles: number;
  hasToken: boolean;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  commitMessage,
  currentBranch = 'main',
  onBranchChange,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'push' | 'workflow' | 'docker'>('push');
  const [liveStatus, setLiveStatus] = useState<GitLiveStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranch || 'main');
  const [isCustomBranch, setIsCustomBranch] = useState<boolean>(false);
  const [customBranchInput, setCustomBranchInput] = useState<string>('');
  const [customCommitMessage, setCustomCommitMessage] = useState<string>(commitMessage);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    branch?: string;
    branchUrl?: string;
    message?: string;
    error?: string;
    details?: string;
    instructions?: string[];
  } | null>(null);

  // Sync commit message prop when changed
  useEffect(() => {
    setCustomCommitMessage(commitMessage);
  }, [commitMessage]);

  useEffect(() => {
    if (currentBranch) {
      setSelectedBranch(currentBranch);
    }
  }, [currentBranch]);

  const activeBranch = isCustomBranch
    ? (customBranchInput.trim().replace(/[^a-zA-Z0-9_\-\.\/]/g, '-') || 'feature/custom')
    : selectedBranch;

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/github/status');
      const data = await res.json();
      if (data.success) {
        setLiveStatus(data);
        if (!selectedBranch || selectedBranch === 'main') {
          setSelectedBranch(data.branch || 'main');
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setPushResult(null);
    }
  }, [isOpen]);

  const handleTriggerPush = async () => {
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage: customCommitMessage || 'feat: AgentStation autonomous multi-agent cluster updates',
          branch: activeBranch,
        }),
      });
      const data = await res.json();
      setPushResult(data);
      if (data.success) {
        onBranchChange?.(activeBranch);
      }
      fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message || 'Push request failed',
      });
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const branchOptions = Array.from(
    new Set([
      'main',
      'develop',
      'staging',
      'feature/autonomous-squads',
      'feature/kinetic-video-studio',
      'feature/sandbox-runner',
      ...(liveStatus?.branches || []),
    ])
  );

  const pushScript = `# 1. Initialize or prepare repository
git init

# 2. Add all workspace files
git add .

# 3. Create commit
git commit -m "${customCommitMessage || 'feat: autonomous agent studio codebase and video assets'}"

# 4. Switch to target branch '${activeBranch}'
git checkout -B ${activeBranch}

# 5. Link remote repository (if not already linked)
git remote add origin ${GITHUB_REPO_INFO.cloneUrl} 2>/dev/null || git remote set-url origin ${GITHUB_REPO_INFO.cloneUrl}

# 6. Push to GitHub branch '${activeBranch}'
git push -u origin ${activeBranch}`;

  const fixExistingOrigin = `# If remote origin already exists:
git remote set-url origin ${GITHUB_REPO_INFO.cloneUrl}
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>GitHub Repository Hub</span>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {GITHUB_REPO_INFO.owner}/{GITHUB_REPO_INFO.repo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Push code, tests, and CI/CD pipelines to your remote repository
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'push'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Git Push Commands</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>GitHub Actions CI</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'docker'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Docker Compose</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono scrollbar-thin">
          {activeTab === 'push' && (
            <>
              {/* Real-time Git Repository Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">
                      Live Repository Environment Status
                    </span>
                  </div>

                  <button
                    onClick={fetchStatus}
                    disabled={isLoadingStatus}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Current Branch</div>
                    <div className="text-blue-400 font-bold flex items-center gap-1 mt-0.5">
                      <GitBranch className="w-3 h-3" />
                      <span>{liveStatus?.branch || 'main'}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Latest Commit</div>
                    <div className="text-slate-200 font-mono font-semibold flex items-center gap-1 mt-0.5 truncate">
                      <GitCommit className="w-3 h-3 text-slate-400" />
                      <span>{liveStatus?.commitHash || 'aafcba0'}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Working Tree</div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{liveStatus?.isClean ? 'Clean (0 changes)' : `${liveStatus?.uncommittedFiles} uncommitted`}</span>
                    </div>
                  </div>
                </div>

                {/* Target Branch Configuration & Push Trigger */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 font-sans">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">Target Remote Branch:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                        {activeBranch}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      activeBranch === 'main'
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {activeBranch === 'main' ? 'Default Production Branch' : 'Feature / Topic Branch'}
                    </span>
                  </div>

                  {/* Branch Selector Dropdown and Custom Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Select Target Branch:
                      </label>
                      <select
                        value={isCustomBranch ? '__custom__' : selectedBranch}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomBranch(true);
                            if (!customBranchInput) setCustomBranchInput('feature/agent-update');
                          } else {
                            setIsCustomBranch(false);
                            setSelectedBranch(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                      >
                        <optgroup label="Core Branches">
                          {branchOptions.filter((b) => ['main', 'develop', 'staging'].includes(b)).map((b) => (
                            <option key={b} value={b}>
                              {b} {b === 'main' ? '(default)' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Feature Branches">
                          {branchOptions.filter((b) => !['main', 'develop', 'staging'].includes(b)).map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </optgroup>
                        <option value="__custom__">✏️ Custom Feature Branch...</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between mb-1">
                        <span>Custom Branch Name:</span>
                        {!isCustomBranch && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomBranch(true);
                              setCustomBranchInput(selectedBranch.startsWith('feature/') ? selectedBranch : `feature/${selectedBranch}`);
                            }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                          >
                            Create new
                          </button>
                        )}
                      </label>
                      <div className="relative">
                        <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={isCustomBranch ? customBranchInput : selectedBranch}
                          onChange={(e) => {
                            setIsCustomBranch(true);
                            setCustomBranchInput(e.target.value.replace(/[^a-zA-Z0-9_\-\.\/]/g, '-'));
                          }}
                          placeholder="e.g. feature/my-new-flow"
                          className={`w-full bg-slate-950 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-2 border font-mono focus:outline-none ${
                            isCustomBranch
                              ? 'border-amber-500/50 focus:border-amber-400 ring-1 ring-amber-500/20'
                              : 'border-slate-800 focus:border-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Branch Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Quick Select:</span>
                    {['main', 'develop', 'feature/autonomous-squads', 'feature/kinetic-video-studio', 'feature/sandbox-runner'].map((b) => {
                      const isSelected = activeBranch === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setIsCustomBranch(false);
                            setSelectedBranch(b);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Commit Message tweak */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Commit Message:
                    </label>
                    <input
                      type="text"
                      value={customCommitMessage}
                      onChange={(e) => setCustomCommitMessage(e.target.value)}
                      placeholder="feat: commit description..."
                      className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-3 py-1.5 border border-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Trigger Push Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="text-slate-400 font-mono truncate max-w-md">
                      Remote: <span className="text-slate-300">{liveStatus?.remoteUrl || GITHUB_REPO_INFO.cloneUrl}</span>
                    </div>

                    <button
                      onClick={handleTriggerPush}
                      disabled={isPushing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50 text-xs"
                    >
                      <Send className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                      <span>{isPushing ? `Pushing to ${activeBranch}...` : `Push to '${activeBranch}'`}</span>
                    </button>
                  </div>
                </div>

                {/* Push feedback output */}
                {pushResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${
                      pushResult.success
                        ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {pushResult.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Push Complete</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Push Status Notice</span>
                        </>
                      )}
                    </div>
                    {pushResult.message && <p>{pushResult.message}</p>}
                    {pushResult.error && <p className="font-semibold">{pushResult.error}</p>}
                    {pushResult.branchUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={pushResult.branchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline"
                        >
                          <span>View '{pushResult.branch || activeBranch}' branch on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {pushResult.instructions && (
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 pt-1">
                        {pushResult.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-bold font-sans">
                  Terminal Commands to Push to {GITHUB_REPO_INFO.cloneUrl}
                </span>
                <button
                  onClick={() => copyText(pushScript, 'all-commands')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition"
                >
                  {copiedKey === 'all-commands' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Script</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 relative">
                <pre className="whitespace-pre-wrap">{pushScript}</pre>
              </div>

              {/* Troubleshooting Note */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-sans font-bold">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Authentication & Common Fixes
                  </span>
                  <button
                    onClick={() => copyText(fixExistingOrigin, 'fix-origin')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'fix-origin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  • If GitHub asks for password, use a <strong>Personal Access Token (PAT)</strong> with <code className="text-blue-400">repo</code> scope.
                </p>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  • If you see <code className="text-amber-300">error: remote origin already exists</code>, run:
                </p>
                <pre className="text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  {fixExistingOrigin}
                </pre>
              </div>
            </>
          )}

          {activeTab === 'workflow' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold font-sans">
                  .github/workflows/agent-station.yml
                </span>
                <button
                  onClick={() => copyText(GITHUB_REPO_INFO.recommendedWorkflow, 'workflow')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition"
                >
                  {copiedKey === 'workflow' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy YAML</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{GITHUB_REPO_INFO.recommendedWorkflow}</pre>
              </div>
            </>
          )}

          {activeTab === 'docker' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold font-sans">
                  docker-compose.yml (Ollama + Fullstack App)
                </span>
                <button
                  onClick={() => copyText(GITHUB_REPO_INFO.dockerCompose, 'docker-compose')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition"
                >
                  {copiedKey === 'docker-compose' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Compose</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{GITHUB_REPO_INFO.dockerCompose}</pre>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <a
            href={GITHUB_REPO_INFO.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition font-sans"
          >
            <span>Open {GITHUB_REPO_INFO.webUrl}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition font-sans"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
