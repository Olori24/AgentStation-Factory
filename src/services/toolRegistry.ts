export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolDefinition {
  name: string;
  category: 'research' | 'data' | 'writing' | 'coding' | 'execution' | 'media' | 'system';
  displayName: string;
  description: string;
  parameters: ToolParameter[];
  returns: string;
  requiresApproval: boolean;
  iconName: string;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  web_search: {
    name: 'web_search',
    category: 'research',
    displayName: 'Live Web Search',
    description: 'Executes targeted search engine queries with live data retrieval and entity grounding.',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query string', required: true },
      { name: 'numResults', type: 'number', description: 'Number of results to retrieve (1-20)', required: false, default: 10 },
      { name: 'targetDomain', type: 'string', description: 'Filter by specific domain (e.g. linkedin.com, ng)', required: false },
    ],
    returns: 'Array of search results with titles, snippets, URLs, and verified entity mentions.',
    requiresApproval: false,
    iconName: 'Search',
  },
  web_browse_scrape: {
    name: 'web_browse_scrape',
    category: 'research',
    displayName: 'Web Scraper & Entity Extractor',
    description: 'Fetches web page content, extracts company profiles, contact emails, phone numbers, and leadership bios.',
    parameters: [
      { name: 'url', type: 'string', description: 'Target website URL', required: true },
      { name: 'extractFields', type: 'array', description: 'List of fields to extract (e.g. executives, email, address)', required: false },
    ],
    returns: 'Structured entity JSON with extracted attributes.',
    requiresApproval: false,
    iconName: 'Globe',
  },
  spreadsheet_builder: {
    name: 'spreadsheet_builder',
    category: 'data',
    displayName: 'Spreadsheet & Dataset Builder',
    description: 'Structures data rows into normalized CSV and interactive table datasets with typed columns and formula metrics.',
    parameters: [
      { name: 'title', type: 'string', description: 'Dataset title', required: true },
      { name: 'columns', type: 'array', description: 'Column definitions with keys, labels, and types', required: true },
      { name: 'rows', type: 'array', description: 'List of data objects matching columns', required: true },
    ],
    returns: 'SpreadsheetDataset object containing CSV string, column schemas, and row data.',
    requiresApproval: false,
    iconName: 'Table',
  },
  document_generator: {
    name: 'document_generator',
    category: 'writing',
    displayName: 'Executive Document & Dossier Generator',
    description: 'Generates professional research dossiers, strategic memos, whitepapers, and reports formatted in structured Markdown.',
    parameters: [
      { name: 'title', type: 'string', description: 'Document title', required: true },
      { name: 'category', type: 'string', description: 'Category: research_dossier, executive_brief, etc.', required: true },
      { name: 'sections', type: 'array', description: 'List of sections with headings and contents', required: true },
    ],
    returns: 'DocumentArtifact object with formatted markdown, table of contents, and metadata.',
    requiresApproval: false,
    iconName: 'FileText',
  },
  outreach_campaign_builder: {
    name: 'outreach_campaign_builder',
    category: 'writing',
    displayName: 'Personalized Outreach Campaign Builder',
    description: 'Creates multi-touch cold email sequences personalized to specific decision makers with dynamic tokens and cadences.',
    parameters: [
      { name: 'campaignName', type: 'string', description: 'Name of the campaign', required: true },
      { name: 'targetAudience', type: 'string', description: 'Target persona description', required: true },
      { name: 'leads', type: 'array', description: 'Array of lead profiles with name, company, email, angle', required: true },
      { name: 'valueProposition', type: 'string', description: 'Core value offering', required: true },
    ],
    returns: 'OutreachCampaign object containing personalized emails, cadence steps, and follow-up templates.',
    requiresApproval: false,
    iconName: 'Send',
  },
  code_synthesizer: {
    name: 'code_synthesizer',
    category: 'coding',
    displayName: 'Full-Stack Code Synthesizer',
    description: 'Synthesizes clean, production-ready Python backends, SQL schemas, React components, and automation scripts.',
    parameters: [
      { name: 'fileName', type: 'string', description: 'Path/filename to generate', required: true },
      { name: 'language', type: 'string', description: 'Programming language (python, typescript, sql, etc.)', required: true },
      { name: 'prompt', type: 'string', description: 'Implementation prompt and requirements', required: true },
    ],
    returns: 'WorkspaceFile object with valid, executable code.',
    requiresApproval: false,
    iconName: 'Code2',
  },
  sandbox_test_runner: {
    name: 'sandbox_test_runner',
    category: 'execution',
    displayName: 'Sandbox PyTest Runner',
    description: 'Executes PyTest test suites and bash validation commands inside an isolated microVM sandbox.',
    parameters: [
      { name: 'command', type: 'string', description: 'Shell test command (e.g. pytest -v tests/)', required: true },
      { name: 'files', type: 'array', description: 'Context files to load into sandbox', required: false },
    ],
    returns: 'TestExecutionResult with exitCode, testsPassed, testsFailed, and stdout logs.',
    requiresApproval: false,
    iconName: 'Terminal',
  },
  presentation_storyboard: {
    name: 'presentation_storyboard',
    category: 'media',
    displayName: 'Kinetic Presentation Storyboarder',
    description: 'Designs 60fps presentation slide decks with kinetic motion choreography, badge layouts, and audio cues.',
    parameters: [
      { name: 'title', type: 'string', description: 'Deck title', required: true },
      { name: 'scenes', type: 'array', description: 'Scene definitions with badges, headlines, bullets, and accents', required: true },
    ],
    returns: 'VideoProject object with full scene hierarchy.',
    requiresApproval: false,
    iconName: 'Film',
  },
  data_exporter: {
    name: 'data_exporter',
    category: 'system',
    displayName: 'Artifact Bundler & Exporter',
    description: 'Packages all generated files, spreadsheets, reports, and campaign templates into a verified downloadable archive.',
    parameters: [
      { name: 'bundleName', type: 'string', description: 'Archive zip name', required: true },
      { name: 'files', type: 'array', description: 'Files to package', required: true },
    ],
    returns: 'Download link and verification SHA256 checksum.',
    requiresApproval: false,
    iconName: 'Download',
  },
};
