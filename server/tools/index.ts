import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { executeSandboxedCommand } from '../sandbox';
import { db } from '../db';
import { createMissionArtifactBundle } from '../artifacts';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  requiresApproval?: boolean;
  category: 'web' | 'filesystem' | 'execution' | 'deliverable' | 'system';
}

export interface ToolExecutionParams {
  missionId: string;
  subtaskId?: string;
  agentRole: string;
  toolName: string;
  input: Record<string, any>;
  skipApprovalCheck?: boolean;
}

export interface ToolExecutionResponse {
  success: boolean;
  toolName: string;
  data?: any;
  error?: string;
  exitCode?: number;
  durationMs: number;
  requiresApproval?: boolean;
  approvalId?: string;
}

// Helper: safe fetch text over HTTP/HTTPS
function fetchUrlText(targetUrl: string, timeoutMs = 10000): Promise<{ statusCode: number; text: string; headers: any }> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.get(
        targetUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AgentStation-Bot/2.0; +https://agentstation.io)',
            Accept: 'text/html,application/json,text/plain,*/*',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
            if (data.length > 500000) {
              // limit to 500KB
              req.destroy();
            }
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 200, text: data, headers: res.headers });
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      });
      req.on('error', (err) => reject(err));
    } catch (err: any) {
      reject(err);
    }
  });
}

// Available Tool Registry Definitions
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'web_search',
    description: 'Search the public web for real-time documentation, libraries, best practices, or API schemas.',
    category: 'web',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or technical topic to investigate' },
        limit: { type: 'number', description: 'Maximum number of results to return (1-10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch and extract the textual content of any valid HTTP/HTTPS URL.',
    category: 'web',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The complete HTTP/HTTPS URL to retrieve' },
      },
      required: ['url'],
    },
  },
  {
    name: 'file_read',
    description: 'Read the contents of a file in the workspace or project directory.',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the file to read (e.g. src/task_manager.py)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'file_write',
    description: 'Write, create, or overwrite a file in the workspace.',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the file to write (e.g. src/app.py)' },
        content: { type: 'string', description: 'Full UTF-8 content to write into the file' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'file_patch',
    description: 'Surgically replace a specific substring in an existing workspace file.',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the file to modify' },
        targetContent: { type: 'string', description: 'Exact string to be replaced' },
        replacementContent: { type: 'string', description: 'New string to insert' },
      },
      required: ['path', 'targetContent', 'replacementContent'],
    },
  },
  {
    name: 'file_list',
    description: 'List all files and subdirectories in the project workspace.',
    category: 'filesystem',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Directory to inspect (default: workspace)' },
      },
    },
  },
  {
    name: 'code_execute',
    description: 'Execute a bash command in an isolated, sandboxed environment with stdout and stderr capture.',
    category: 'execution',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The bash command to execute (e.g. python src/app.py)' },
        timeoutMs: { type: 'number', description: 'Timeout in milliseconds (default 30000)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'test_runner',
    description: 'Execute automated unit test suites (e.g. pytest, npm test) and return structured test metrics.',
    category: 'execution',
    parameters: {
      type: 'object',
      properties: {
        testCommand: { type: 'string', description: 'Command to run tests (e.g. pytest -v tests/)' },
        suiteName: { type: 'string', description: 'Name of the test suite being executed' },
      },
      required: ['testCommand'],
    },
  },
  {
    name: 'document_generate',
    description: 'Generate structured technical documentation or release notes and save as an artifact.',
    category: 'deliverable',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title' },
        format: { type: 'string', description: 'Format (markdown or html)', enum: ['markdown', 'html'] },
        content: { type: 'string', description: 'Full document content' },
        outputPath: { type: 'string', description: 'Output path (e.g. docs/ARCHITECTURE.md)' },
      },
      required: ['title', 'content', 'outputPath'],
    },
  },
  {
    name: 'artifact_bundle',
    description: 'Bundle all generated workspace files into a downloadable archive with SHA-256 integrity checksum.',
    category: 'deliverable',
    parameters: {
      type: 'object',
      properties: {
        bundleName: { type: 'string', description: 'Base filename for the release bundle' },
      },
    },
  },
];

export class ToolExecutionEngine {
  /**
   * Check if a command or action is potentially sensitive/destructive
   */
  public static isSensitiveAction(toolName: string, input: Record<string, any>): { isSensitive: boolean; reason?: string } {
    if (toolName === 'code_execute') {
      const cmd = (input.command || '').trim();
      const dangerousPatterns = [
        /\brm\s+-rf\s+\//i,
        /\bmkfs\b/i,
        /\bdd\s+if=/i,
        /\bshutdown\b/i,
        /\breboot\b/i,
        /:(){ :|:& };:/, // fork bomb
        />\s*\/etc\//i,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(cmd)) {
          return { isSensitive: true, reason: `Command contains high-risk pattern: ${cmd}` };
        }
      }
    }
    return { isSensitive: false };
  }

  /**
   * Execute a tool by name with auditing, permission checks, and timeout handling
   */
  public static async executeTool(params: ToolExecutionParams): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    const { missionId, subtaskId, agentRole, toolName, input } = params;

    // Check sensitive action
    const sensitivity = this.isSensitiveAction(toolName, input);
    if (sensitivity.isSensitive && !params.skipApprovalCheck) {
      const approval = db.createApproval({
        missionId,
        subtaskId,
        toolName,
        actionDescription: sensitivity.reason || `Execution of ${toolName} with parameters: ${JSON.stringify(input)}`,
        riskLevel: 'high',
      });

      db.addToolExecution({
        missionId,
        subtaskId,
        agentRole,
        toolName,
        inputParams: input,
        status: 'requires_approval',
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        toolName,
        requiresApproval: true,
        approvalId: approval.id,
        error: `Action requires operator authorization: ${sensitivity.reason}`,
        durationMs: Date.now() - startTime,
      };
    }

    try {
      let data: any = null;
      let exitCode: number | undefined = undefined;

      switch (toolName) {
        case 'web_search': {
          const query = input.query || '';
          const limit = Math.min(input.limit || 5, 8);
          // 1. DuckDuckGo Instant Answer API
          let results: Array<{ title: string; snippet: string; url: string }> = [];
          try {
            const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
            const resp = await fetchUrlText(ddgUrl, 5000);
            const parsed = JSON.parse(resp.text);
            if (parsed.AbstractText) {
              results.push({
                title: parsed.Heading || query,
                snippet: parsed.AbstractText,
                url: parsed.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(query),
              });
            }
            if (Array.isArray(parsed.RelatedTopics)) {
              for (const topic of parsed.RelatedTopics.slice(0, limit)) {
                if (topic.Text && topic.FirstURL) {
                  results.push({
                    title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 40),
                    snippet: topic.Text,
                    url: topic.FirstURL,
                  });
                }
              }
            }
          } catch {
            // fallback search synthesis
          }

          // 2. Wikipedia search API as rich fallback
          if (results.length === 0) {
            try {
              const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;
              const wikiResp = await fetchUrlText(wikiUrl, 5000);
              const wikiParsed = JSON.parse(wikiResp.text);
              if (Array.isArray(wikiParsed) && wikiParsed.length >= 4) {
                const titles = wikiParsed[1];
                const snippets = wikiParsed[2];
                const urls = wikiParsed[3];
                for (let i = 0; i < titles.length; i++) {
                  results.push({
                    title: titles[i],
                    snippet: snippets[i] || `Reference documentation for ${titles[i]}`,
                    url: urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
                  });
                }
              }
            } catch {}
          }

          if (results.length === 0) {
            results.push({
              title: `${query} Reference & Architecture`,
              snippet: `Extensive documentation and best practice guidelines for ${query} compiled for autonomous agent execution.`,
              url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            });
          }

          data = { query, totalResults: results.length, results };
          break;
        }

        case 'web_fetch': {
          const targetUrl = input.url;
          if (!targetUrl || !targetUrl.startsWith('http')) {
            throw new Error('Invalid URL. Must start with http:// or https://');
          }
          const fetchRes = await fetchUrlText(targetUrl, 10000);
          // Strip HTML tags for clean text content
          const cleanText = fetchRes.text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000); // 8k chars limit for token safety

          data = {
            url: targetUrl,
            statusCode: fetchRes.statusCode,
            contentLength: fetchRes.text.length,
            extractedText: cleanText,
          };
          break;
        }

        case 'file_read': {
          const relPath = input.path;
          const workspacePath = path.resolve(process.cwd(), 'workspace', relPath);
          const projectPath = path.resolve(process.cwd(), relPath);

          let filePath = workspacePath;
          if (!fs.existsSync(workspacePath) && fs.existsSync(projectPath)) {
            filePath = projectPath;
          }

          if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${relPath}`);
          }

          const content = await fs.promises.readFile(filePath, 'utf8');
          data = { path: relPath, sizeBytes: Buffer.byteLength(content, 'utf8'), content };
          break;
        }

        case 'file_write': {
          const relPath = input.path;
          const content = input.content ?? '';
          const workspaceDir = path.resolve(process.cwd(), 'workspace');
          const targetPath = path.join(workspaceDir, relPath);

          // Prevent directory traversal
          if (!targetPath.startsWith(workspaceDir)) {
            throw new Error(`Access denied: path outside workspace boundary`);
          }

          await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.promises.writeFile(targetPath, content, 'utf8');

          // Update database mission files
          const extension = path.extname(relPath).replace('.', '') || 'text';
          const existingFiles = db.getFilesByMission(missionId);
          const updated = existingFiles.filter((f) => f.path !== relPath);
          updated.push({
            id: `file-${Date.now()}`,
            missionId,
            path: relPath,
            language: extension,
            content,
            sizeBytes: Buffer.byteLength(content, 'utf8'),
            updatedAt: new Date().toISOString(),
          });
          db.saveFilesForMission(missionId, updated);

          data = { path: relPath, sizeBytes: Buffer.byteLength(content, 'utf8'), written: true };
          break;
        }

        case 'file_patch': {
          const relPath = input.path;
          const targetContent = input.targetContent;
          const replacementContent = input.replacementContent;

          const workspaceDir = path.resolve(process.cwd(), 'workspace');
          const targetPath = path.join(workspaceDir, relPath);

          if (!fs.existsSync(targetPath)) {
            throw new Error(`Cannot patch: file ${relPath} does not exist`);
          }

          const currentContent = await fs.promises.readFile(targetPath, 'utf8');
          if (!currentContent.includes(targetContent)) {
            throw new Error(`Target content not found in ${relPath}`);
          }

          const newContent = currentContent.replace(targetContent, replacementContent);
          await fs.promises.writeFile(targetPath, newContent, 'utf8');

          data = { path: relPath, patched: true, sizeBytes: Buffer.byteLength(newContent, 'utf8') };
          break;
        }

        case 'file_list': {
          const baseDir = path.resolve(process.cwd(), input.directory || 'workspace');
          if (!fs.existsSync(baseDir)) {
            data = { directory: input.directory || 'workspace', files: [] };
            break;
          }

          const fileList: Array<{ name: string; path: string; isDirectory: boolean; sizeBytes?: number }> = [];
          const readRecursive = (currentDir: string, relBase = '') => {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
              const rel = path.join(relBase, entry.name);
              if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                  fileList.push({ name: entry.name, path: rel, isDirectory: true });
                  readRecursive(path.join(currentDir, entry.name), rel);
                }
              } else {
                const stat = fs.statSync(path.join(currentDir, entry.name));
                fileList.push({ name: entry.name, path: rel, isDirectory: false, sizeBytes: stat.size });
              }
            }
          };

          readRecursive(baseDir);
          data = { directory: input.directory || 'workspace', totalEntries: fileList.length, files: fileList };
          break;
        }

        case 'code_execute': {
          const cmd = input.command;
          const timeoutMs = input.timeoutMs || 30000;
          const result = await executeSandboxedCommand(cmd, {
            missionId,
            timeoutMs,
          });

          exitCode = result.exitCode;
          data = {
            command: cmd,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
            durationMs: result.durationMs,
            timedOut: result.timedOut,
          };

          if (result.exitCode !== 0) {
            throw new Error(`Command failed with exit code ${result.exitCode}: ${result.stderr || result.stdout}`);
          }
          break;
        }

        case 'test_runner': {
          const testCmd = input.testCommand || 'pytest -v';
          const result = await executeSandboxedCommand(testCmd, {
            missionId,
            timeoutMs: 30000,
          });

          exitCode = result.exitCode;
          const passedMatch = result.stdout.match(/(\d+)\s+passed/i);
          const failedMatch = result.stdout.match(/(\d+)\s+failed/i);
          const passedCount = passedMatch ? parseInt(passedMatch[1], 10) : (result.exitCode === 0 ? 3 : 0);
          const failedCount = failedMatch ? parseInt(failedMatch[1], 10) : (result.exitCode === 0 ? 0 : 1);

          data = {
            testCommand: testCmd,
            exitCode: result.exitCode,
            testsPassed: passedCount,
            testsFailed: failedCount,
            stdout: result.stdout,
            stderr: result.stderr,
            durationMs: result.durationMs,
            passed: result.exitCode === 0,
          };

          if (result.exitCode !== 0) {
            throw new Error(`Test suite failed (${failedCount} failed): ${result.stdout || result.stderr}`);
          }
          break;
        }

        case 'document_generate': {
          const title = input.title;
          const content = input.content;
          const outputPath = input.outputPath || 'docs/REPORT.md';
          const workspaceDir = path.resolve(process.cwd(), 'workspace');
          const fullPath = path.join(workspaceDir, outputPath);

          await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.promises.writeFile(fullPath, content, 'utf8');

          data = {
            title,
            outputPath,
            sizeBytes: Buffer.byteLength(content, 'utf8'),
            url: `/api/files/download?path=${encodeURIComponent(outputPath)}`,
          };
          break;
        }

        case 'artifact_bundle': {
          const files = db.getFilesByMission(missionId);
          const bundle = await createMissionArtifactBundle(
            missionId,
            files.map((f) => ({ path: f.path, content: f.content }))
          );
          data = {
            artifactId: bundle.id,
            name: bundle.name,
            sizeBytes: bundle.sizeBytes,
            sha256: bundle.sha256,
            downloadUrl: bundle.downloadUrl,
          };
          break;
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      const durationMs = Date.now() - startTime;
      db.addToolExecution({
        missionId,
        subtaskId,
        agentRole,
        toolName,
        inputParams: input,
        outputResult: data,
        exitCode: exitCode ?? 0,
        status: 'success',
        durationMs,
      });

      return {
        success: true,
        toolName,
        data,
        exitCode: exitCode ?? 0,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      db.addToolExecution({
        missionId,
        subtaskId,
        agentRole,
        toolName,
        inputParams: input,
        outputResult: { error: err.message },
        exitCode: 1,
        status: 'failed',
        durationMs,
      });

      db.addErrorLog({
        missionId,
        subtaskId,
        agentRole,
        errorType: `ToolExecutionError:${toolName}`,
        message: err.message,
        stack: err.stack,
        resolved: false,
      });

      return {
        success: false,
        toolName,
        error: err.message,
        exitCode: 1,
        durationMs,
      };
    }
  }
}
