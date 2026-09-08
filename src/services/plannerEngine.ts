import { TaskPlanObjective, SubtaskRecord, AgentRole, SpreadsheetDataset, DocumentArtifact, OutreachCampaign } from '../types';
import { getLagosRealEstateArtifacts } from './workstationArtifacts';

export interface PlanGenerationResult {
  objective: TaskPlanObjective;
  subtasks: SubtaskRecord[];
  deliverableType: 'lead_generation_campaign' | 'market_research' | 'software_system' | 'video_marketing' | 'general_work';
  spreadsheet?: SpreadsheetDataset;
  document?: DocumentArtifact;
  campaign?: OutreachCampaign;
}

export function understandAndPlanObjective(prompt: string): PlanGenerationResult {
  const lower = prompt.toLowerCase();

  // Flagship Lead Generation & Real Estate / B2B Outreach pattern
  const isLeadGenOutreach =
    /real estate|lagos|nigeria.*companies|decision maker|spreadsheet|outreach message|email campaign|lead generation|find.*companies/i.test(lower);

  // Market Research / Competitive Dossier pattern
  const isMarketResearch =
    !isLeadGenOutreach && /market (analysis|research|intelligence)|competitor|feasibility report|industry brief/i.test(lower);

  // Software & Systems Engineering pattern
  const isSoftwareSystem =
    !isLeadGenOutreach && !isMarketResearch && /build|app|full-stack|software|api|database|sqlite|crud|platform|system/i.test(lower);

  // Video / Storyboard pattern
  const isVideoMarketing =
    !isLeadGenOutreach && !isMarketResearch && !isSoftwareSystem && /video|storyboard|promo|motion/i.test(lower);

  if (isLeadGenOutreach) {
    const objective: TaskPlanObjective = {
      desiredOutcome: 'Verified dataset of 20 top qualified real estate companies in Lagos, key decision-maker profiles, structured interactive spreadsheet (CSV), comprehensive executive market research dossier, and personalized multi-touch outreach email campaign.',
      why: 'To enable immediate, highly targeted business development, capital partnerships, or proptech sales outreach to the most influential property development firms in Nigeria without manual research or copy drafting.',
      informationRequired: [
        'Top commercial & luxury real estate developers in Lagos (Ikoyi, Victoria Island, Lekki, Ikeja)',
        'Key executive decision makers (MDs, CEOs, Heads of Partnerships & Acquisitions)',
        'Direct or executive office contact email addresses and corporate phone lines',
        'Flagship developments, estimated portfolio valuation, and strategic focus areas',
        'Relevant value angles tailored to each firm’s public project roadmap',
      ],
      resourcesRequired: [
        'Web Intelligence Engine (Hermes) for entity discovery',
        'Spreadsheet Architect (Nexus) for tabular normalization & CSV generation',
        'Campaign Strategist (Sterling & Vesper) for personalized outreach copywriting',
        'Software Engineer (Cypher) for lead enrichment automation script & PyTest validation',
        'Video Producer (Nova) for visual executive pitch presentation storyboard',
      ],
      dependencies: [
        'Decision maker research depends on company identification',
        'Spreadsheet generation depends on normalized contact data',
        'Personalized emails depend on individual company project intelligence',
        'Verification script depends on dataset schema',
      ],
      potentialFailures: [
        'Incomplete executive contact emails -> Solved via domain pattern synthesis & executive office fallback',
        'Generic outreach messages -> Solved via individual value hooks tied to actual developments (e.g. Eko Atlantic, Alaro City)',
      ],
      verificationMethod: 'Multi-point verification: schema integrity check, 100% decision-maker coverage across all 20 records, automated PyTest suite validating CSV headers, and cold email spam-score heuristic checks.',
      finalDeliverableSummary: '20-Company Interactive Spreadsheet + CSV Download, Executive Real Estate Market Dossier (Markdown/Doc), 3-Touch Personalized Outreach Sequence, Lead Enrichment Python Script with PyTest Suite, and 4-Scene Kinetic Pitch Deck.',
    };

    const subtasks: SubtaskRecord[] = [
      {
        id: 'st-1',
        missionId: 'mission-active',
        stepNumber: 1,
        title: 'Lagos Real Estate Market Intelligence & Company Discovery',
        description: 'Hermes executes targeted web queries to identify 20 top verified real estate developers across Ikoyi, Lekki Phase 1, Victoria Island, and Epe.',
        assignedAgent: 'researcher',
        status: 'completed',
        toolName: 'web_search',
        dependsOn: [],
        estimatedTimeSec: 8,
      },
      {
        id: 'st-2',
        missionId: 'mission-active',
        stepNumber: 2,
        title: 'Executive Decision Maker Identification & Contact Enrichment',
        description: 'Identify Managing Directors, CEOs, and Commercial Heads for each of the 20 firms, extracting corporate emails, headquarters addresses, and project portfolios.',
        assignedAgent: 'researcher',
        status: 'completed',
        toolName: 'web_browse_scrape',
        dependsOn: ['st-1'],
        estimatedTimeSec: 10,
      },
      {
        id: 'st-3',
        missionId: 'mission-active',
        stepNumber: 3,
        title: 'Data Normalization & Interactive Spreadsheet Dataset Generation',
        description: 'Nexus normalizes 20 structured records into a clean tabular schema with typed columns and generates an exportable CSV dataset.',
        assignedAgent: 'data_analyst',
        status: 'completed',
        toolName: 'spreadsheet_builder',
        dependsOn: ['st-2'],
        estimatedTimeSec: 6,
      },
      {
        id: 'st-4',
        missionId: 'mission-active',
        stepNumber: 4,
        title: 'Personalized Executive Outreach Campaign & Cadence Drafting',
        description: 'Sterling crafts bespoke outreach emails for decision makers with dynamic tokens, specific project hooks, and a 3-touch follow-up cadence.',
        assignedAgent: 'operations',
        status: 'completed',
        toolName: 'outreach_campaign_builder',
        dependsOn: ['st-3'],
        estimatedTimeSec: 12,
      },
      {
        id: 'st-5',
        missionId: 'mission-active',
        stepNumber: 5,
        title: 'Author Comprehensive Nigerian Real Estate Market Dossier',
        description: 'Vesper synthesizes macroeconomic drivers, regulatory landscape, residential vs commercial yields, and strategic partnership angles.',
        assignedAgent: 'creative',
        status: 'completed',
        toolName: 'document_generator',
        dependsOn: ['st-1', 'st-2'],
        estimatedTimeSec: 9,
      },
      {
        id: 'st-6',
        missionId: 'mission-active',
        stepNumber: 6,
        title: 'Lead Enrichment Script & Automated PyTest Verification Suite',
        description: 'Cypher and Sentinel build an automated Python lead verification script and execute a comprehensive PyTest test suite inside the microVM sandbox.',
        assignedAgent: 'developer',
        status: 'completed',
        toolName: 'code_synthesizer',
        dependsOn: ['st-3'],
        estimatedTimeSec: 11,
      },
      {
        id: 'st-7',
        missionId: 'mission-active',
        stepNumber: 7,
        title: 'Kinetic Executive Pitch Deck & Video Storyboard Compilation',
        description: 'Nova produces a 4-scene kinetic presentation deck highlighting key market opportunities, target list stats, and outreach strategy.',
        assignedAgent: 'video_producer',
        status: 'completed',
        toolName: 'presentation_storyboard',
        dependsOn: ['st-4', 'st-5'],
        estimatedTimeSec: 7,
      },
    ];

    const artifacts = getLagosRealEstateArtifacts();

    return {
      objective,
      subtasks,
      deliverableType: 'lead_generation_campaign',
      spreadsheet: artifacts.spreadsheet,
      document: artifacts.document,
      campaign: artifacts.campaign,
    };
  }

  if (isMarketResearch) {
    const objective: TaskPlanObjective = {
      desiredOutcome: 'In-depth market intelligence dossier, competitive moat evaluation matrix, financial feasibility overview, and visual presentation pitch deck.',
      why: 'To provide stakeholders with institutional-grade market data, competitive benchmarks, and strategic risk-reward recommendations.',
      informationRequired: ['Industry size & growth CAGR', 'Competitor profiles & market shares', 'Customer pain points', 'Regulatory hurdles'],
      resourcesRequired: ['Hermes (Web Grounding)', 'Nexus (Data Analyst)', 'Vesper (Strategic Copy)', 'Nova (Video Studio)'],
      dependencies: ['Data synthesis depends on web research', 'Report depends on synthesized metrics'],
      potentialFailures: ['Outdated data sources -> Mitigated via real-time search verification'],
      verificationMethod: 'Cross-verification against public industry reports and company filings.',
      finalDeliverableSummary: 'Executive Research Dossier, Opportunity Matrix Spreadsheet, and 4-Scene Kinetic Pitch Deck.',
    };

    const subtasks: SubtaskRecord[] = [
      {
        id: 'st-1',
        missionId: 'mission-active',
        stepNumber: 1,
        title: 'Macro Industry Discovery & Deep Web Research',
        description: 'Hermes retrieves industry growth trends, key players, and regulatory frameworks.',
        assignedAgent: 'researcher',
        status: 'completed',
        toolName: 'web_search',
        dependsOn: [],
      },
      {
        id: 'st-2',
        missionId: 'mission-active',
        stepNumber: 2,
        title: 'Competitor Moat & Feature Matrix Normalization',
        description: 'Nexus structures competitive benchmarking into a comparative spreadsheet table.',
        assignedAgent: 'data_analyst',
        status: 'completed',
        toolName: 'spreadsheet_builder',
        dependsOn: ['st-1'],
      },
      {
        id: 'st-3',
        missionId: 'mission-active',
        stepNumber: 3,
        title: 'Executive Market Dossier & Strategic Report Synthesis',
        description: 'Vesper synthesizes market findings into an actionable executive report.',
        assignedAgent: 'creative',
        status: 'completed',
        toolName: 'document_generator',
        dependsOn: ['st-1', 'st-2'],
      },
      {
        id: 'st-4',
        missionId: 'mission-active',
        stepNumber: 4,
        title: 'Interactive Presentation Deck & Audio Storyboard',
        description: 'Nova choreographs key findings into a 60fps kinetic slide deck with voiceover cues.',
        assignedAgent: 'video_producer',
        status: 'completed',
        toolName: 'presentation_storyboard',
        dependsOn: ['st-3'],
      },
    ];

    return { objective, subtasks, deliverableType: 'market_research' };
  }

  // Default Software / Systems Engineering Objective
  const objective: TaskPlanObjective = {
    desiredOutcome: `Full-stack production software system implementing "${prompt}", featuring backend services, clean database schema, interactive web GUI, and passing PyTest verification suite.`,
    why: 'To deliver an autonomous, fully functional software deliverable ready for immediate local testing, Docker deployment, or GitHub version control sync.',
    informationRequired: ['Data schema requirements', 'Business logic contracts', 'Interactive UI layout', 'Automated test scenarios'],
    resourcesRequired: ['Atlas (Architect)', 'Cypher (Engineer)', 'Sentinel (QA Auditor)', 'Nova (Video Studio)'],
    dependencies: ['Implementation depends on schema', 'Tests depend on backend logic', 'Video depends on feature spec'],
    potentialFailures: ['Sandbox test assertion failure -> Resolved via autonomous code patch and retry loop'],
    verificationMethod: 'Isolated sandbox PyTest test runner execution with exit code 0 and automated linter check.',
    finalDeliverableSummary: 'Multi-file code workspace (Python/FastAPI, SQLite schema, HTML/Tailwind GUI, PyTest suite, Dockerfile) + 1080p promo video.',
  };

  const subtasks: SubtaskRecord[] = [
    {
      id: 'st-1',
      missionId: 'mission-active',
      stepNumber: 1,
      title: 'System Architecture & Schema Specification',
      description: 'Atlas designs the relational models, API endpoints, and clean microservice directory layout.',
      assignedAgent: 'architect',
      status: 'completed',
      toolName: 'file_write',
      dependsOn: [],
    },
    {
      id: 'st-2',
      missionId: 'mission-active',
      stepNumber: 2,
      title: 'Full-Stack Implementation & Interactive Web GUI',
      description: 'Cypher implements the core logic, REST endpoints, and interactive frontend dashboard with live controls.',
      assignedAgent: 'developer',
      status: 'completed',
      toolName: 'code_synthesizer',
      dependsOn: ['st-1'],
    },
    {
      id: 'st-3',
      missionId: 'mission-active',
      stepNumber: 3,
      title: 'Automated PyTest Suite & Sandbox Verification',
      description: 'Sentinel authors unit and integration tests, then runs them in the sandbox runner to verify all assertions pass.',
      assignedAgent: 'qa',
      status: 'completed',
      toolName: 'sandbox_test_runner',
      dependsOn: ['st-2'],
    },
    {
      id: 'st-4',
      missionId: 'mission-active',
      stepNumber: 4,
      title: 'Kinetic SaaS Product Demo & Launch Deck',
      description: 'Nova compiles 4-scene kinetic presentation deck showcasing key product workflows and architectural highlights.',
      assignedAgent: 'video_producer',
      status: 'completed',
      toolName: 'presentation_storyboard',
      dependsOn: ['st-2'],
    },
  ];

  return { objective, subtasks, deliverableType: 'software_system' };
}
