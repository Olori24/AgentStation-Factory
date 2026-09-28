import crypto from "crypto";
import { agentRouterChat } from "./agentRouter";

export type AgentRole = "researcher" | "architect" | "developer" | "qa" | "documenter" | "system";

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  provider: "agentrouter";
  model?: string;
  capabilities: string[];
  systemPrompt: string;
  maxConcurrency: number;
  enabled: boolean;
}

export interface AgentTask {
  id: string;
  missionId?: string;
  agentId: string;
  objective: string;
  status: "queued" | "running" | "completed" | "failed";
  result?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

const agents = new Map<string, AgentDefinition>();
const tasks = new Map<string, AgentTask>();

function add(agent: AgentDefinition) {
  agents.set(agent.id, agent);
}

add({
  id: "researcher",
  name: "Researcher",
  role: "researcher",
  provider: "agentrouter",
  capabilities: ["web_research", "synthesis"],
  systemPrompt: "You are AgentStation Researcher. Investigate the assigned objective, distinguish evidence from assumptions, and return actionable findings.",
  maxConcurrency: 1,
  enabled: true,
});
add({
  id: "architect",
  name: "Architect",
  role: "architect",
  provider: "agentrouter",
  capabilities: ["architecture", "planning", "decomposition"],
  systemPrompt: "You are AgentStation Architect. Turn the assigned objective into a concrete implementation plan and identify risks.",
  maxConcurrency: 1,
  enabled: true,
});
add({
  id: "engineer",
  name: "Engineer",
  role: "developer",
  provider: "agentrouter",
  capabilities: ["coding", "debugging", "refactoring"],
  systemPrompt: "You are AgentStation Engineer. Solve the assigned engineering objective and report verification steps.",
  maxConcurrency: 2,
  enabled: true,
});
add({
  id: "qa",
  name: "Sentinel QA",
  role: "qa",
  provider: "agentrouter",
  capabilities: ["testing", "security_review", "verification"],
  systemPrompt: "You are AgentStation QA. Find defects, regressions and security issues and return reproducible findings.",
  maxConcurrency: 1,
  enabled: true,
});
add({
  id: "documenter",
  name: "Documenter",
  role: "documenter",
  provider: "agentrouter",
  capabilities: ["documentation", "release_notes"],
  systemPrompt: "You are AgentStation Documenter. Convert verified work into precise documentation. Never invent implementation details.",
  maxConcurrency: 1,
  enabled: true,
});

export function listAgents() {
  return [...agents.values()];
}

export function listTasks(missionId?: string) {
  return [...tasks.values()]
    .filter((task) => !missionId || task.missionId === missionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function runOne(agent: AgentDefinition, task: AgentTask) {
  task.status = "running";
  task.startedAt = new Date().toISOString();

  try {
    const result = await agentRouterChat({
      model: agent.model,
      system: agent.systemPrompt,
      user: task.objective,
    });

    task.status = "completed";
    task.result = {
      text: result.text,
      provider: result.provider,
      model: result.model,
      requestId: result.requestId,
    };
  } catch (error) {
    task.status = "failed";
    task.error = error instanceof Error ? error.message : String(error);
  }

  task.finishedAt = new Date().toISOString();
  return task;
}

export async function dispatchAgents(input: {
  missionId?: string;
  tasks: Array<{ agentId: string; objective: string }>;
  maxParallel?: number;
}) {
  if (!Array.isArray(input.tasks) || input.tasks.length === 0) {
    throw new Error("tasks must contain at least one agent task");
  }
  if (input.tasks.length > 8) {
    throw new Error("maximum 8 parallel agents per dispatch");
  }

  const parallel = Math.max(1, Math.min(8, Number(input.maxParallel || 4)));
  const queued = input.tasks.map((spec) => {
    const agent = agents.get(spec.agentId);
    if (!agent || !agent.enabled) {
      throw new Error(`Agent unavailable: ${spec.agentId}`);
    }

    const objective = String(spec.objective || "").trim();
    if (!objective) {
      throw new Error(`Objective required for ${spec.agentId}`);
    }

    const task: AgentTask = {
      id: `agent-task-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      missionId: input.missionId,
      agentId: agent.id,
      objective,
      status: "queued",
      createdAt: new Date().toISOString(),
    };

    tasks.set(task.id, task);
    return task;
  });

  let cursor = 0;
  const worker = async () => {
    while (cursor < queued.length) {
      const index = cursor++;
      const task = queued[index];
      const agent = agents.get(task.agentId);
      if (agent) await runOne(agent, task);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(parallel, queued.length) }, worker),
  );

  return {
    count: queued.length,
    completed: queued.filter((task) => task.status === "completed").length,
    failed: queued.filter((task) => task.status === "failed").length,
    tasks: queued,
  };
}
