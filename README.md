# AgentStation

> **Autonomous Fullstack Multi-Agent Cluster Orchestrator with Real-Time Sandbox Execution & Kinetic Video Studio**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8e24aa.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ Overview

**AgentStation** is an autonomous multi-agent development platform that orchestrates specialized AI agents to plan, architect, implement, test, and package production-ready web software. It pairs autonomous cluster logic with a live in-browser sandbox runner and a kinetic product launch video studio.

---

## 🤖 The Multi-Agent Squad

AgentStation employs five specialized agents working in tandem:

| Agent | Role | Focus Area |
|---|---|---|
| **Chief Architect** | System Design & Decomposition | Tech stack selection, API contracts, folder architecture, milestone breakdown |
| **Frontend Specialist** | UI/UX & Responsive Views | React 19, Tailwind CSS v4, component hierarchies, accessibility & interaction design |
| **Backend Engineer** | APIs & Data Layer | Express routing, REST endpoints, database schema design, authentication & security |
| **QA Engineer** | Testing & Validation | Edge case verification, unit & integration test suites, error recovery validation |
| **DevOps Lead** | Deployment & Infrastructure | Docker containerization, CI/CD GitHub workflows, cloud readiness & Git sync |

---

## 🚀 Key Features

### 1. Autonomous Cluster Orchestration
- **Dual Engine Execution**: Powered by Google Gemini with graceful fallback chains (`gemini-flash-latest` → `gemini-3.1-flash-lite` → `gemini-3.8-flash`) plus local Ollama LLM support.
- **Real-Time Activity Stream**: Live visual timeline tracking agent deliberations, code generation, testing phases, and milestone completions.

### 2. Live Interactive Code Workspace
- **Multi-File Explorer**: Interactive code editor supporting TypeScript, JavaScript, CSS, HTML, and JSON.
- **In-Browser Sandbox Runner**: Execute client code safely in a sandbox iframe with console capture.
- **Instant Export**: Download entire generated codebases as `.zip` archives with a single click.

### 3. Kinetic Video Studio
- **HTML5 Canvas 60 FPS Engine**: Generates high-impact promotional and launch videos directly from codebase specs.
- **Built-In Audio Synthesizer**: Web Audio API rhythm and beat track generator with Web Speech API voiceover narration.
- **Aspect Ratio Switching**: 16:9 widescreen for desktop/YouTube and 9:16 vertical for Shorts/TikTok/Reels.

### 4. Git & GitHub Hub
- **Live Repository Synchronization**: Direct sync with `Olori24/AgentStation-Factory` and `Olori24/AgentStation`.
- **1-Click Push Mechanism**: Authenticated push directly to GitHub using your personal access token.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

```bash
# Clone the repository
git clone https://github.com/Olori24/AgentStation-Factory.git
cd AgentStation-Factory

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Optional: Google Gemini API key for cloud LLM reasoning
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: GitHub Personal Access Token (repo scope) for 1-click push
GITHUB_TOKEN="your_github_token_here"

# Server Port (default 3000)
PORT=3000
```

### Running Locally

```bash
# Start development server with hot reload
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
# Compile client assets and bundle server
npm run build

# Start production server
npm run start
```

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── index.html                # Application entry HTML
├── package.json              # Scripts and dependencies
├── server.ts                 # Express backend API & Vite SSR middleware
├── vite.config.ts            # Vite build configuration
├── tsconfig.json             # TypeScript compiler settings
└── src/
    ├── main.tsx              # React entry point
    ├── App.tsx               # Main application container & state engine
    ├── types.ts              # Core TypeScript interfaces & enums
    ├── data/
    │   └── defaults.ts       # Preset missions, templates, and agent definitions
    └── components/
        ├── Header.tsx        # Top navigation & cluster status
        ├── SquadBar.tsx      # Agent squad status & active roles
        ├── PromptStation.tsx # Mission input & template selector
        ├── AgentActivityStream.tsx # Real-time agent log & thought stream
        ├── CodeWorkspace.tsx # Multi-file code editor, runner & zip export
        ├── VideoStudio.tsx   # Kinetic canvas renderer & audio sequencer
        ├── GitHubModal.tsx   # Git push hub & repository status
        └── OllamaModal.tsx   # Local LLM configuration
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
