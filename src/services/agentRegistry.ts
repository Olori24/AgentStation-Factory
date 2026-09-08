import { AgentRole } from '../types';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

export interface AgentDefinition {
  id: AgentRole;
  name: string;
  roleTitle: string;
  badge: string;
  specialty: string;
  model: string;
  color: string;
  description: string;
  capabilities: string[];
  requiredInputs: string[];
  outputSchema: string;
  availableTools: string[];
  permissions: string[];
  timeoutSec: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  verificationRequirements: string;
}

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  architect: {
    id: 'architect',
    name: 'Atlas',
    roleTitle: 'Lead Software Architect',
    badge: 'System Design & Spec',
    specialty: 'System Architecture, Relational Schemas, Data Modeling & Contracts',
    model: 'Gemini 2.5 Flash / Qwen-2.5-Coder',
    color: '#3b82f6',
    description: 'Decomposes complex objectives into modular technical architectures, directory topologies, and clean software contracts.',
    capabilities: [
      'Objective parsing & technical decomposition',
      'Relational database modeling (PostgreSQL / SQLite)',
      'API contract specification (REST / OpenAPI)',
      'Security boundary & permission modeling',
    ],
    requiredInputs: ['User prompt', 'Business constraints', 'Existing repository state'],
    outputSchema: 'SystemArchitectureSpec { modules, schemas, contracts, directoryTree }',
    availableTools: ['file_write', 'file_read', 'file_patch', 'code_execute'],
    permissions: ['filesystem:write', 'filesystem:read'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: 'Schema syntax validation, no circular dependencies',
  },
  developer: {
    id: 'developer',
    name: 'Cypher',
    roleTitle: 'Senior Full-Stack Engineer',
    badge: 'Code Implementation',
    specialty: 'Python, TypeScript, FastAPI, React, Docker, Asynchronous Pipelines',
    model: 'Gemini 2.5 Flash / Qwen-2.5-Coder:14b',
    color: '#10b981',
    description: 'Translates architectural blueprints into robust, executable production code, microservices, and interactive UI views.',
    capabilities: [
      'Full-stack backend & API implementation',
      'Responsive React / Tailwind UI crafting',
      'Automation scripts (scraping, ETL, lead enrichment)',
      'Containerization (Dockerfile & Docker Compose)',
    ],
    requiredInputs: ['Architectural spec', 'Target language', 'Data models'],
    outputSchema: 'WorkspaceFile[] { path, language, content }',
    availableTools: ['file_write', 'file_patch', 'code_execute', 'test_runner'],
    permissions: ['filesystem:write', 'terminal:execute'],
    timeoutSec: 60,
    retryPolicy: { maxRetries: 3, backoffMs: 1500 },
    verificationRequirements: 'Zero syntax errors, static type correctness',
  },
  qa: {
    id: 'qa',
    name: 'Sentinel',
    roleTitle: 'DevOps & QA Auditor',
    badge: 'Verification & Testing',
    specialty: 'Sandbox Runner, PyTest Suites, Security Auditing, Performance Benchmarking',
    model: 'Gemini 2.5 Flash / DeepSeek-R1',
    color: '#f59e0b',
    description: 'Executes automated testing in isolated sandboxes, identifies regressions, audits permissions, and verifies deliverables.',
    capabilities: [
      'Automated unit & integration test suites (PyTest / Vitest)',
      'Vulnerability & secret scanning',
      'Sandbox execution & assertion checking',
      'CI/CD pipeline verification',
    ],
    requiredInputs: ['Code files', 'Test assertions', 'Security standards'],
    outputSchema: 'TestExecutionResult { exitCode, testsPassed, testsFailed, stdout }',
    availableTools: ['test_runner', 'code_execute', 'file_read'],
    permissions: ['terminal:execute', 'filesystem:read'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: '100% test pass rate, exitCode == 0',
  },
  researcher: {
    id: 'researcher',
    name: 'Hermes',
    roleTitle: 'Market Intelligence & Deep Researcher',
    badge: 'Web Research & Intelligence',
    specialty: 'Market Analysis, Competitor Intelligence, Lead Sourcing, Dossiers',
    model: 'Gemini 2.5 Flash / Web Grounding',
    color: '#06b6d4',
    description: 'Conducts deep-dive web queries, scrapes verified company intelligence, finds decision-maker contacts, and gathers market signals.',
    capabilities: [
      'Web search query generation & grounding',
      'Company & organization profile enrichment',
      'Executive & decision-maker identification',
      'Market opportunity & competitive moat evaluation',
    ],
    requiredInputs: ['Research topic', 'Geographic region', 'Target parameters'],
    outputSchema: 'ResearchDossier { entities, metrics, sources, executiveSummary }',
    availableTools: ['web_search', 'web_browse_scrape', 'file_write', 'document_generator'],
    permissions: ['network:http', 'filesystem:write'],
    timeoutSec: 60,
    retryPolicy: { maxRetries: 3, backoffMs: 2000 },
    verificationRequirements: 'Minimum 90% verified entity citation',
  },
  data_analyst: {
    id: 'data_analyst',
    name: 'Nexus',
    roleTitle: 'Lead Data Analyst & Spreadsheet Architect',
    badge: 'Spreadsheets & Datasets',
    specialty: 'Tabular Data Normalization, CSV/Excel Datasets, Financial Calculations',
    model: 'Gemini 2.5 Flash / Data Engine',
    color: '#14b8a6',
    description: 'Structures messy web and business data into clean, typed, exportable spreadsheets, relational tables, and KPI metric cards.',
    capabilities: [
      'Tabular dataset generation & schema typing',
      'CSV / JSON / XLSX format generation',
      'Lead contact data normalization & deduplication',
      'Summary metrics & statistical aggregation',
    ],
    requiredInputs: ['Raw entity data', 'Column specifications', 'Normalization rules'],
    outputSchema: 'SpreadsheetDataset { columns, rows, csvContent, summaryMetrics }',
    availableTools: ['spreadsheet_builder', 'file_write', 'data_exporter'],
    permissions: ['filesystem:write'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: 'All rows conform to column types, non-null primary keys',
  },
  operations: {
    id: 'operations',
    name: 'Sterling',
    roleTitle: 'Business Operations & Outreach Specialist',
    badge: 'Campaigns & Partnerships',
    specialty: 'Personalized B2B Outreach, Multi-Touch Cadences, Value Proposition Customization',
    model: 'Gemini 2.5 Flash / Strategy Engine',
    color: '#f97316',
    description: 'Drafts bespoke, highly personalized email outreach sequences tailored to each individual executive and business profile.',
    capabilities: [
      'Personalized executive cold email drafting',
      'Dynamic variable injection ({{first_name}}, {{company}}, etc.)',
      'Multi-touch follow-up cadence design (Day 1, Day 3, Day 7)',
      'Compelling call-to-action formulation',
    ],
    requiredInputs: ['Decision maker profile', 'Company research', 'Outreach goal'],
    outputSchema: 'OutreachCampaign { targetAudience, strategy, emails, cadenceSteps }',
    availableTools: ['outreach_campaign_builder', 'document_generator', 'file_write'],
    permissions: ['filesystem:write'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: 'No generic placeholders, valid recipient mapping',
  },
  creative: {
    id: 'creative',
    name: 'Vesper',
    roleTitle: 'Creative Director & Copywriter',
    badge: 'Strategy & Narrative',
    specialty: 'Executive Reports, Brand Positioning, Value Propositions, Dossiers',
    model: 'Gemini 2.5 Flash / Llama-3.3:70b',
    color: '#ec4899',
    description: 'Synthesizes market findings and business goals into high-impact executive reports, strategic memos, and compelling brand copy.',
    capabilities: [
      'Executive whitepaper & dossier authoring',
      'Strategic memorandum drafting',
      'Value proposition engineering',
      'Brand narrative synthesis',
    ],
    requiredInputs: ['Research findings', 'Target audience', 'Tone guidelines'],
    outputSchema: 'DocumentArtifact { title, category, markdownContent, author }',
    availableTools: ['document_generator', 'file_write'],
    permissions: ['filesystem:write'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: 'Executive readability, structured headings and takeaways',
  },
  video_producer: {
    id: 'video_producer',
    name: 'Nova',
    roleTitle: 'Motion & Video Producer',
    badge: 'Video & Visual Deck',
    specialty: 'Kinetic Canvas Animation, Audio Timing, Presentation Storyboards',
    model: 'AgentStation Video Engine 2.0',
    color: '#8b5cf6',
    description: 'Generates kinetic 60fps video presentations, slide decks, and audio cues for visual stakeholder presentations.',
    capabilities: [
      'Kinetic motion storyboard compilation',
      'Scene pacing & keyframe choreography',
      'Audio soundtrack mood & voiceover timing',
      'Canvas video render configuration',
    ],
    requiredInputs: ['Campaign theme', 'Value props', 'Visual assets'],
    outputSchema: 'VideoProject { title, scenes, audioScript, totalDurationSec }',
    availableTools: ['presentation_storyboard', 'file_write'],
    permissions: ['filesystem:write'],
    timeoutSec: 45,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    verificationRequirements: 'Valid scene durations, non-empty scripts',
  },
  admin: {
    id: 'admin',
    name: 'Aegis',
    roleTitle: 'Executive Assistant & Compliance Specialist',
    badge: 'Governance & Packaging',
    specialty: 'Workflow Orchestration, Regulatory Audits, Deliverable Packaging',
    model: 'Gemini 2.5 Flash / Operations Engine',
    color: '#6366f1',
    description: 'Ensures deliverable completeness, verifies regulatory compliance, packages zip archives, and requests human approvals when needed.',
    capabilities: [
      'Deliverable packaging & checksum generation',
      'Human approval gate management',
      'Task status monitoring & progress tracking',
      'Executive summary compilation',
    ],
    requiredInputs: ['Mission subtask results', 'Artifact files', 'Compliance rules'],
    outputSchema: 'MissionArtifactPackage { checksum, files, approvalStatus }',
    availableTools: ['artifact_bundle', 'file_read', 'file_write'],
    permissions: ['filesystem:read', 'filesystem:write'],
    timeoutSec: 30,
    retryPolicy: { maxRetries: 1, backoffMs: 500 },
    verificationRequirements: 'All requested artifacts accounted for',
  },
};
