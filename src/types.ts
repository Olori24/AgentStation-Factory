export type AgentRole =
  | 'architect'
  | 'developer'
  | 'qa'
  | 'creative'
  | 'video_producer'
  | 'researcher'
  | 'data_analyst'
  | 'operations'
  | 'admin'
  | 'system';

export interface AgentProfile {
  id: AgentRole;
  name: string;
  roleTitle: string;
  badge: string;
  specialty: string;
  model: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  color: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  language: 'python' | 'javascript' | 'typescript' | 'json' | 'yaml' | 'markdown' | 'dockerfile' | 'bash' | 'html' | 'css' | 'sql' | string;
  content: string;
  sizeBytes?: number;
}

export interface VideoScene {
  id: string;
  sceneIndex: number;
  durationSec: number;
  badge: string;
  heading: string;
  subheading: string;
  bulletPoints: string[];
  codePreview?: string;
  accentColor: string; // hex or rgb
  callToAction?: string;
}

export interface VideoProject {
  title: string;
  hook: string;
  subtitle: string;
  scenes: VideoScene[];
  totalDurationSec: number;
  audioScript: string;
  soundtrackMood: 'energetic-tech' | 'cyberpunk' | 'ambient-clean';
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  role: AgentRole;
  agentName: string;
  type: 'status' | 'thought' | 'tool_call' | 'code_gen' | 'terminal' | 'video' | 'complete';
  message: string;
  details?: string;
}

export interface TestExecutionResult {
  command: string;
  stdout: string;
  stderr?: string;
  exitCode: number;
  testsPassed: number;
  testsFailed: number;
  durationMs: number;
}

export interface TerminalStreamMessage {
  type: 'connection_established' | 'terminal_start' | 'terminal_chunk' | 'terminal_exit' | 'terminal_error' | 'pong';
  command?: string;
  text?: string;
  stream?: 'stdout' | 'stderr';
  exitCode?: number;
  durationMs?: number;
  testsPassed?: number;
  testsFailed?: number;
  missionId?: string;
  timestamp?: string;
  activeClients?: number;
}

export interface SpreadsheetColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'link' | 'email' | 'badge';
  width?: string;
}

export interface SpreadsheetDataset {
  id: string;
  title: string;
  description?: string;
  columns: SpreadsheetColumn[];
  rows: Record<string, any>[];
  csvContent: string;
  totalCount: number;
  summaryMetrics?: { label: string; value: string }[];
}

export interface DocumentArtifact {
  id: string;
  title: string;
  category: 'research_dossier' | 'executive_brief' | 'technical_spec' | 'market_report' | 'legal_contract';
  markdownContent: string;
  author: string;
  createdAt: string;
  readTimeMin?: number;
  tags?: string[];
}

export interface OutreachEmail {
  id: string;
  recipientName: string;
  recipientRole: string;
  company: string;
  email: string;
  subject: string;
  body: string;
  callToAction: string;
  stepIndex: number;
  status: 'draft' | 'ready' | 'approved';
  followUpCadence?: string;
}

export interface OutreachCampaign {
  id: string;
  campaignName: string;
  targetAudience: string;
  strategy: string;
  emails: OutreachEmail[];
  totalContacts: number;
  cadenceSteps: { day: number; title: string; purpose: string }[];
}

export interface TaskPlanObjective {
  desiredOutcome: string;
  why: string;
  informationRequired: string[];
  resourcesRequired: string[];
  dependencies: string[];
  potentialFailures: string[];
  verificationMethod: string;
  finalDeliverableSummary: string;
}

export interface SquadMission {
  id: string;
  prompt: string;
  createdAt: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStage: string;
  progressPercent: number;
  files: WorkspaceFile[];
  execution: TestExecutionResult;
  video: VideoProject;
  logs: AgentLogEntry[];
  gitBranch: string;
  gitCommitMessage: string;
  spreadsheet?: SpreadsheetDataset;
  document?: DocumentArtifact;
  campaign?: OutreachCampaign;
  objectiveBreakdown?: TaskPlanObjective;
  subtasks?: SubtaskRecord[];
  approvals?: ApprovalRecord[];
}

export interface GitHubRepoMeta {
  owner: string;
  repo: string;
  cloneUrl: string;
  webUrl: string;
  defaultBranch: string;
  recommendedWorkflow: string;
  dockerCompose: string;
  dockerfile: string;
}

export interface CiStatusInfo {
  status: 'completed' | 'in_progress' | 'queued' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | null | string;
  runId?: number;
  runUrl?: string;
  runNumber?: number;
  updatedAt?: string;
  commitSha?: string;
  workflowName?: string;
}

export interface FullStackUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer' | 'reviewer';
  avatar: string;
  organizationId: string;
  createdAt: string;
}

export interface FullStackJob {
  id: string;
  type: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  attempt: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  createdAt: string;
}

export interface FullStackArtifact {
  id: string;
  missionId: string;
  name: string;
  type: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
  createdAt: string;
}

export interface SubtaskRecord {
  id: string;
  missionId: string;
  stepNumber: number;
  title: string;
  description: string;
  assignedAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  toolName?: string;
  toolInput?: Record<string, any>;
  toolResult?: any;
  error?: string;
  dependsOn?: string[];
  estimatedTimeSec?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface ApprovalRecord {
  id: string;
  missionId: string;
  action: string;
  reason: string;
  details?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  responder?: string;
}

export interface ToolExecutionRecord {
  id: string;
  missionId: string;
  agentRole: string;
  toolName: string;
  inputPayload: Record<string, any>;
  outputPayload?: any;
  status: 'success' | 'failed' | 'pending';
  durationMs: number;
  errorMessage?: string;
  executedAt: string;
}
