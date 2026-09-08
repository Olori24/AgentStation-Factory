# AgentStation

<div align="center">

# ⚡ AgentStation
### Autonomous Multi-Agent AI Workforce Platform
**Manus-Class Autonomous Execution • AgentStation Identity • Production-Grade Artifact Synthesis**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E24AA?logo=google&logoColor=white)](https://ai.google.dev/)
[![Ollama](https://img.shields.io/badge/Local_LLM-Ollama-black?logo=ollama&logoColor=white)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Overview](#-overview) •
[Core Principles](#-core-principles) •
[Autonomous Workflow](#-autonomous-workflow) •
[Workstation Architecture](#-workstation-architecture) •
[Agent Fleet](#-the-specialist-agent-fleet) •
[Tool Engine](#-tool-execution-engine) •
[Quickstart](#-quickstart) •
[API Reference](#-api-reference) •
[GitHub Sync](#-github-integration)

</div>

---

## ⚡ Overview

**AgentStation** is an autonomous multi-agent engineering and intelligence platform designed to function as a **digital workforce**. Rather than merely answering questions or generating isolated code snippets, AgentStation allows operators to state high-level objectives—from building complex full-stack web applications with automated test suites to conducting exhaustive market research, financial feasibility reports, and pitch presentations.

The platform autonomously:
1. **Decomposes** high-level objectives into structured, dependency-aware subtasks.
2. **Assigns** each phase to specialist agents with defined system prompts and tool access.
3. **Executes** multi-step actions across an isolated sandbox and microVM environment.
4. **Verifies** execution results through automated testing (PyTest, test runners, checksums).
5. **Gauges Risk** with human-in-the-loop approval gates for sensitive or destructive operations.
6. **Delivers** verified, production-ready deliverables: source code, interactive web applications, technical dossiers, and kinetic launch videos.

> **Product Directive**: *"Manus-level capability, AgentStation identity."*  
> AgentStation benchmarks the highest standard of autonomous task planning, multi-tool chaining, and microVM interaction while maintaining its own original design system, multi-agent coordination architecture, and artifact-first workflow.

---

## 🧠 Core Principles

AgentStation is built upon eight fundamental operational tenets:

| Principle | Description |
|---|---|
| **1. Autonomous** | Executes end-to-end multi-step missions with minimal manual prompting. |
| **2. Tool-Using** | Equips agents with real tools (sandbox bash, filesystem patchers, web scrapers, test runners). |
| **3. Plan-First** | Deconstructs unstructured user prompts into discrete, trackable subtask checklists before execution. |
| **4. State & Memory** | Maintains full execution lineage, mission checkpoints, and file manifests across sessions. |
| **5. Continuous Verification** | Never considers an objective complete without passing automated test suites or assertion checks. |
| **6. Self-Healing & Recovery** | Automatically retries failed subtasks with modified parameters or prompts for strategic pivots. |
| **7. Human-in-the-Loop Safety** | Pauses execution and prompts the operator for approval on destructive commands (`rm`, `git push`, etc.). |
| **8. Artifact-Centric** | Prioritizes tangible outputs: runnable code, live preview applications, verified zip bundles, and media. |

---

## 🔄 Autonomous Workflow

```
                        [ User Objective ]
      "Research Nigerian real estate, analyze top 5 opportunities,
          generate detailed report and prepare a presentation"
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   AGENTSTATION CORE   │
                     │  Planning & Strategy  │
                     └──────────┬────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      [ Subtask Decomposition ]         [ Specialist Dispatch ]
      1. Market Intelligence            ➔ Hermes (Researcher)
      2. Opportunity Matrix             ➔ Hermes (Researcher)
      3. System Architecture            ➔ Atlas (Architect)
      4. Code & Endpoint Implementation ➔ Cypher (Developer)
      5. Sandbox PyTest Verification    ➔ Sentinel (QA Lead)
      6. Executive Dossier Generation   ➔ Vesper (Creative)
      7. Kinetic Presentation / Video   ➔ Nova (Producer)
                                │
                                ▼
                     ┌───────────────────────┐
                     │   SANDBOX EXECUTION   │
                     │    & TOOL CALLING     │
                     ├───────────────────────┤
                     │ • web_search          │
                     │ • file_write / patch  │
                     │ • code_execute        │
                     │ • test_runner (PyTest)│
                     │ • artifact_bundle     │
                     └──────────┬────────────┘
                                │
                                ▼
                     ┌───────────────────────┐
                     │  OPERATOR APPROVAL?   │
                     │ (High-Risk Operation) │
                     └──────┬─────────┬──────┘
                   Approved │         │ Denied
                            ▼         ▼
                  [ Continue Run ]   [ Abort / Reroute ]
                            │
                            ▼
                     ┌───────────────────────┐
                     │  VERIFICATION ENGINE  │
                     │  • Test Pass Check    │
                     │  • SHA-256 Checksum   │
                     └──────────┬────────────┘
                                │
                                ▼
                  [ Final Artifact Delivery ]
                  • Running Interactive Web App
                  • Downloadable Codebase (.zip)
                  • Technical Dossier (.md)
                  • 60 FPS Kinetic Presentation
```

---

## 🖥️ Workstation Architecture

AgentStation presents a high-density, 3-panel autonomous workspace modeled for mission oversight and direct interaction:

```
┌─────────────────┬─────────────────────────────┬────────────────────────────────────────┐
│  PANEL 1: NAV   │     PANEL 2: CONVERSATION   │     PANEL 3: AGENTSTATION WORKSTATION   │
│  & SQUAD RAIL   │       & SUBTASK STREAM      │              VIRTUAL SANDBOX           │
├─────────────────┼─────────────────────────────┼────────────────────────────────────────┤
│ • New Mission   │ • Real-time Task Objective  │ [Browser] [Editor] [Terminal] [Media]  │
│ • Preset Cards  │ • Autonomous Plan Checklist │ ────────────────────────────────────── │
│ • Fleet Status  │   [✓] 1. Intelligence Query │  • Live In-Browser Web App Runner      │
│ • Tool Audit    │   [►] 2. Writing Data Schema│  • Multi-File Syntax-Highlighted IDE   │
│ • DB Records    │   [ ] 3. PyTest Execution  │  • Interactive Terminal / Test Logs    │
│ • Git Push Hub  │ • Tool Execution Badges     │  • 60 FPS Kinetic Video Canvas Engine  │
│ • Model Select  │ • Operator Approval Card    │  • SHA-256 Verified Artifact Bundler   │
│                 │ • Pause / Resume Controls   │                                        │
└─────────────────┴─────────────────────────────┴────────────────────────────────────────┘
```

### 1. Left Control Rail (Panel 1)
- **Fleet Roster**: Live health and activity status for each specialized agent.
- **Mission History**: Searchable database of past autonomous runs with 1-click state restoration.
- **AI Provider Switcher**: Toggle seamlessly between cloud LLMs (Google Gemini 2.5 Flash / Gemini Pro) and offline local models (Ollama: DeepSeek R1, Llama 3, CodeLlama).
- **GitHub Hub**: One-click repository sync, branch creation, diff preview, and push auditing.

### 2. Autonomous Conversation & Subtask Stream (Panel 2)
- **Dynamic Task Plan**: Visual subtask tree tracking execution order, assigned specialist, and state (`pending`, `in_progress`, `completed`, `failed`).
- **Tool Audit Pills**: Live feedback detailing parameters, execution time, and stdout/stderr for every tool invoked.
- **Human-in-the-Loop Safeguards**: Embedded approval cards requiring explicit operator confirmation before executing potentially hazardous commands.
- **Mission Controls**: Pause, Resume, or Cancel missions mid-flight.

### 3. AgentStation Workstation / Sandbox (Panel 3)
- **Live Workstation Browser**: Direct rendering of full-stack client code in an isolated iframe sandbox with error capture and viewport scaling.
- **Interactive Spreadsheet Dataset Matrix**: Institutional tabular viewer with real-time column sorting, global text filtering, quick metric statistics, and 1-click CSV export.
- **Executive Intelligence Dossier & Report Viewer**: Distraction-free markdown research room with typography scaling, estimated read times, table of contents navigation, and copy-to-clipboard actions.
- **Outreach Campaign & Email Sequence Studio**: High-touch outreach manager with multi-touch cadences (Day 1, Day 4, Day 8), full email preview modal, personalized CTAs, and instant clipboard export.
- **Multi-File Code IDE**: Full code explorer and editor with dirty state detection, syntax highlighting, and instant file creation.
- **Sandbox Terminal & Test Runner**: Real-time streaming terminal displaying test outputs, PyTest assertion matrices, and system metrics.
- **Kinetic Video Studio**: In-browser 60 FPS HTML5 canvas engine that synthesizes animated product storyboards, Web Audio synthesizer rhythms, and Web Speech API narration.
- **Pipeline CI/CD Hub**: Live status monitor tracking linting, PyTest suites, Docker container builds, and security scans.
- **Artifact Manager**: Download complete project bundles (.zip) with cryptographic SHA-256 verification hashes.

---

## 🤖 The Specialist Agent Fleet

AgentStation coordinates an ensemble of purpose-built agents, each possessing specialized domain knowledge:

| Agent | Role & Title | Specialty & Capabilities | Model / Engine |
|---|---|---|---|
| **Atlas** | Lead Systems Architect | System decomposition, technical specifications, REST API contracts, and schema design. | Gemini 2.5 Flash |
| **Cypher** | Senior Full-Stack Engineer | Production TypeScript, React 19, Express routing, robust error handling, and CLI tools. | Gemini 2.5 Flash / DeepSeek |
| **Sentinel** | DevOps & QA Auditor | Test suite design, PyTest sandbox assertions, boundary condition auditing, and security checks. | Gemini 2.5 Flash |
| **Vesper** | Creative & Research Director | Executive documentation, architecture diagrams, narrative synthesis, and market dossiers. | Gemini 2.5 Flash |
| **Nova** | Motion & Video Producer | Kinetic typography, 60 FPS canvas animation, Web Audio soundtrack sequencing, and pitch decks. | Canvas Engine + Web Audio |
| **Hermes** | Market & Tech Intelligence | Autonomous web scraping, competitor intelligence, opportunity benchmarking, and financial analysis. | Gemini 2.5 / Web Grounding |
| **Nexus** | Lead Data Analyst & Spreadsheet Architect | Lead data normalization, financial modeling, interactive CSV/XLSX matrix generation, and summary metrics. | Gemini 2.5 / Data Engine |
| **Sterling** | Business Operations & Outreach Specialist | Personalized cold outreach, decision-maker profiling, multi-touch email sequence cadences, and partnership angles. | Gemini 2.5 / Strategy Engine |
| **Aegis** | Executive Assistant & Compliance Specialist | Autonomous workflow orchestration, regulatory title governance audits, and final deliverable packaging. | Gemini 2.5 / Operations Engine |

---

## 🛠️ Tool Execution Engine

Agents do not hallucinate outputs—they invoke deterministic tools inside a secure execution sandbox:

```typescript
// Built-in Agent Tools available to the orchestrator:
export const TOOL_REGISTRY = {
  web_search:         "Query real-time web search engines and synthesize cited summaries",
  web_fetch:          "Fetch arbitrary webpage content and extract clean markdown/text",
  file_read:          "Read file content from the isolated workspace directory",
  file_write:         "Write new files or overwrite existing workspace artifacts",
  file_patch:         "Apply targeted surgical diffs to existing codebase files",
  file_list:          "List files and directories within the mission workspace",
  code_execute:       "Execute bash scripts or node commands inside the protected sandbox",
  test_runner:        "Run automated PyTest or unit test suites and parse assertion results",
  document_generate:  "Compile formatted technical documentation, READMEs, and executive briefs",
  artifact_bundle:    "Package generated codebase into a downloadable zip with SHA-256 checksum"
};
```

### Safety & Risk Auditing
Every tool call is evaluated by the **Risk Engine**:
- **Low Risk** (`file_read`, `file_list`, `web_search`, `document_generate`): Auto-executed within milliseconds.
- **Medium Risk** (`file_write`, `file_patch`, `test_runner`): Tracked in the audit log and sandboxed.
- **High Risk** (`code_execute` with destructive flags, `git push`, environment alterations): Triggers an interactive **Operator Approval Card** in the UI, halting execution until explicitly authorized.

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- *(Optional)* **Google Gemini API Key**: For cloud-accelerated reasoning ([Get a key](https://aistudio.google.com/))
- *(Optional)* **Ollama**: For 100% offline, local LLM execution ([Install Ollama](https://ollama.ai/))

### 1. Clone the Repository
```bash
git clone https://github.com/Olori24/AgentStation-Factory.git
cd AgentStation-Factory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
# Server Port (Default: 3000)
PORT=3000

# Optional: Google Gemini API Key for autonomous agent reasoning
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: GitHub Personal Access Token (repo scope) for 1-click push
GITHUB_TOKEN="your_github_token_here"
```

### 4. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Build for Production
```bash
# Compiles React 19 client and bundles Express backend with esbuild
npm run build

# Start the bundled production server
npm run start
```

---

## 📡 API Reference

AgentStation exposes a full suite of REST and Server-Sent Event (SSE) endpoints:

### Autonomous Task Orchestration
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tasks/plan` | Decomposes a high-level prompt into an ordered subtask plan. |
| `GET` | `/api/tasks/:id/subtasks` | Retrieves subtasks and live status for a mission. |
| `POST` | `/api/tasks/:id/approve` | Submits operator approval or denial for a paused subtask. |
| `GET` | `/api/approvals` | Lists pending and historical human-in-the-loop approvals. |
| `GET` | `/api/tools` | Returns the registry of available agent tools. |

### Mission & Execution
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orchestrate` | Dispatches the multi-agent cluster to execute a prompt. |
| `GET` | `/api/missions` | Returns historical mission runs with file manifests and metrics. |
| `GET` | `/api/missions/:id` | Returns full state, logs, and artifacts for a specific mission. |
| `GET` | `/api/artifacts/:id/download`| Downloads the verified `.zip` bundle for a mission. |

### Real-Time Streaming
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stream/events` | SSE stream for real-time agent thoughts, logs, and milestone ticks. |
| `GET` | `/api/terminal/stream` | SSE stream capturing live terminal outputs and PyTest executions. |

### GitHub Integration
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/github/status` | Fetches active branch, clean/dirty state, and recent commit history. |
| `POST` | `/api/github/push` | Stages workspace files, commits, and pushes directly to GitHub. |
| `POST` | `/api/github/branch` | Creates a new branch and checks out workspace tree. |

---

## 🐙 GitHub Integration

AgentStation includes a zero-friction Git management hub accessible directly from the navigation rail:
- **One-Click Commit & Push**: Automatically serializes current workspace files, stages changes, generates conventional commit messages, and pushes to remote with live audit logging.
- **Branch Management**: Create feature or release branches (`feat/`, `fix/`, `release/`) with automated stash/pop protection.
- **Live Status Auditing**: Real-time display of uncommitted changes, active branch status, author credentials, and commit hashes.

---

## 💡 Example Missions to Try

Paste any of these high-level objectives into the AgentStation omnibox:

1. **Market Intelligence & Strategy**:
   > *"Research the Nigerian real estate market, identify the top five opportunities, analyze competitors, create a detailed report and prepare a presentation."*

2. **Full-Stack Engineering**:
   > *"Build an enterprise Kanban task manager with SQLite persistence, REST API, drag-and-drop board, and PyTest validation suite."*

3. **High-Frequency Financial System**:
   > *"Create a real-time cryptocurrency arbitrage terminal with live WebSocket ticker, risk calculators, and depth charts."*

4. **Kinetic Marketing Campaign**:
   > *"Generate a kinetic 1080p SaaS product launch video with punchy hook scenes, audio cues, and voiceover script."*

---

## 📁 Repository Structure

```
├── data/
│   └── agentstation_relational_db.json # Durable database for missions, subtasks & audits
├── server/
│   ├── orchestrator/
│   │   └── index.ts          # Autonomous planning, decomposition & execution engine
│   ├── tools/
│   │   └── index.ts          # Tool registry, sandbox executors & permission guards
│   ├── db.ts                 # Relational database interface & query helpers
│   ├── streaming.ts          # Server-Sent Events (SSE) event broadcasters
│   └── artifacts.ts          # File packager & SHA-256 checksum bundler
├── server.ts                 # Main Express application, API routes & Vite middleware
├── src/
│   ├── components/
│   │   ├── ManusHeroPrompt.tsx        # AgentStation omnibox & objective input hub
│   │   ├── ManusConversation.tsx      # Subtask checklist, objective breakdown & approval cards
│   │   ├── ManusComputer.tsx          # Workstation sandbox container & tab routing
│   │   ├── SpreadsheetViewer.tsx      # Interactive tabular spreadsheet & CSV export engine
│   │   ├── DocumentViewer.tsx         # Executive intelligence dossier & markdown reader
│   │   ├── OutreachCampaignViewer.tsx # 3-touch personalized email campaign viewer & copy triggers
│   │   ├── ManusSidebar.tsx           # Navigation rail, fleet status & history
│   │   ├── CodeWorkspace.tsx          # Multi-file code editor with live syntax engine
│   │   ├── VideoStudio.tsx            # 60 FPS HTML5 canvas & Web Audio synth engine
│   │   ├── GitHubModal.tsx            # Direct GitHub push & branch creation modal
│   │   └── OllamaModal.tsx            # Local LLM selection & configuration modal
│   ├── services/
│   │   ├── plannerEngine.ts           # Autonomous objective decomposition & requirement planning
│   │   ├── workstationArtifacts.ts    # Institutional dataset, dossier & campaign generators
│   │   ├── softwareFactory.ts         # Deterministic full-stack application blueprints
│   │   ├── agentRegistry.ts           # Specialist agent persona profiles & model configs
│   │   ├── toolRegistry.ts            # Client-side deterministic tool mock & execution bus
│   │   └── autonomousEngine.ts        # Client-side autonomous execution loop
│   ├── data/
│   │   ├── defaults.ts                # Default agent squad roster & system definitions
│   │   └── sampleMissions.ts          # Pre-seeded blueprints (Lagos RE, Full-Stack, Crypto Arbitrage)
│   ├── App.tsx                        # Top-level state engine & layout controller
│   └── types.ts                       # TypeScript interfaces for agents, tools, tasks & artifacts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🤝 Contributing

Contributions to AgentStation are enthusiastically welcomed! Whether you are adding new tools to `server/tools/`, introducing specialized agent personas, or enhancing the microVM workspace:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feat/quantum-tool-executor`).
3. Commit your Changes (`git commit -m 'feat: add quantum tool executor'`).
4. Push to the Branch (`git push origin feat/quantum-tool-executor`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<div align="center">
<sub>Engineered with precision for autonomous AI workflows. AgentStation © 2026.</sub>
</div>
