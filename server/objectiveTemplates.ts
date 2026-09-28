export interface ObjectiveTemplate {
  id: string;
  name: string;
  category: "revenue" | "marketing" | "operations" | "engineering";
  description: string;
  outcome: string;
  inputs: string[];
  tasks: Array<{ agentId: string; objective: string; skillIds?: string[] }>;
}

const templates: ObjectiveTemplate[] = [
  {
    id: "lead-generation-engine",
    name: "Lead Generation Engine",
    category: "revenue",
    description: "Research qualified prospects, score fit, prepare personalized outreach and produce a measurable sales list.",
    outcome: "A verified prospect list with evidence of fit, outreach angles and next actions.",
    inputs: ["offer", "idealCustomer", "market", "leadCount"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Research {{leadCount}} potential {{idealCustomer}} prospects in {{market}} for this offer: {{offer}}. Capture public evidence of fit and exclude weak matches." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Define a qualification rubric for {{idealCustomer}} prospects buying {{offer}}. Score prospects using explicit evidence and identify the strongest segments." },
      { agentId: "documenter", skillIds: ["research"], objective: "Turn verified prospect findings into an actionable sales brief for {{offer}}, including evidence, personalization angles and next steps. Do not invent facts." }
    ]
  },
  {
    id: "appointment-setting-engine",
    name: "Appointment Setting Engine",
    category: "revenue",
    description: "Convert a defined target market into qualified appointment opportunities.",
    outcome: "Qualification rules, outreach sequence, booking workflow and handoff criteria.",
    inputs: ["offer", "targetMarket", "meetingType", "capacity"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Identify high-fit prospect characteristics for {{offer}} in {{targetMarket}} and produce a qualification checklist." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Design an appointment-setting workflow for {{offer}} with qualification, routing, follow-up, booking and no-response states. Meeting type: {{meetingType}}. Capacity: {{capacity}}." },
      { agentId: "documenter", skillIds: ["research"], objective: "Create factual outreach and follow-up templates for the appointment workflow, with clear stop conditions." }
    ]
  },
  {
    id: "business-automation-audit",
    name: "Business Automation Audit",
    category: "operations",
    description: "Find repetitive, costly workflows and turn them into prioritized automation opportunities.",
    outcome: "Prioritized automation opportunities with impact, dependencies, risks and implementation plan.",
    inputs: ["businessType", "workflowDescription", "tools"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Analyze this {{businessType}} workflow: {{workflowDescription}}. Identify repetitive steps, bottlenecks, manual handoffs, failure points and duplicated data." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Design provider-neutral automation architectures for the highest-impact opportunities using {{tools}}. Include triggers, actions, retries, human approvals and rollback paths." },
      { agentId: "qa", skillIds: ["quality-gate"], objective: "Threat-model the proposed automation for {{businessType}}. Identify data, permission, reliability and operational risks and define acceptance tests." },
      { agentId: "documenter", skillIds: ["research"], objective: "Produce an implementation-ready automation audit with prioritized opportunities, assumptions, dependencies, acceptance criteria and next actions." }
    ]
  },
  {
    id: "competitor-intelligence",
    name: "Competitor Intelligence Sprint",
    category: "marketing",
    description: "Build an evidence-backed competitor snapshot and identify gaps worth testing.",
    outcome: "Competitor matrix, evidence, uncertainties, positioning hypotheses and experiments.",
    inputs: ["company", "market", "competitors"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Research {{competitors}} for {{company}} in {{market}}. Compare publicly documented offers, positioning, pricing signals, channels and customer-facing claims. Separate evidence from inference." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Turn competitor evidence into a positioning test plan for {{company}}. Define hypotheses, evidence needed and measurable experiments." },
      { agentId: "documenter", skillIds: ["research"], objective: "Create an executive competitor brief for {{company}} with source-backed findings, uncertainties and concrete experiments." }
    ]
  },
  {
    id: "content-campaign-engine",
    name: "Content Campaign Engine",
    category: "marketing",
    description: "Turn a business offer into a measurable multi-channel campaign.",
    outcome: "Campaign strategy, content queue, CTA variants and measurement plan.",
    inputs: ["offer", "audience", "platforms", "campaignGoal"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Research audience pain points and content opportunities for {{offer}} targeting {{audience}} on {{platforms}}. Distinguish evidence from assumptions." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Design a campaign around {{campaignGoal}} with content pillars, funnel stages, cadence, CTA strategy and measurable KPIs." },
      { agentId: "documenter", skillIds: ["research"], objective: "Produce a production-ready content queue for {{offer}}, including hooks, formats, CTA variants and measurement fields." }
    ]
  },
  {
    id: "software-build-sprint",
    name: "Software Build Sprint",
    category: "engineering",
    description: "Convert a feature request into an implementation, test and verification plan.",
    outcome: "Architecture, implementation breakdown, risk-based tests and release checklist.",
    inputs: ["feature", "stack", "constraints"],
    tasks: [
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Decompose this feature into a production-ready architecture and implementation plan. Feature: {{feature}}. Stack: {{stack}}. Constraints: {{constraints}}." },
      { agentId: "engineer", skillIds: ["software-delivery"], objective: "Create the code-level work breakdown for {{feature}} using {{stack}}. Include interfaces, migrations, failure handling and verification steps." },
      { agentId: "qa", skillIds: ["quality-gate"], objective: "Create a risk-based test plan for {{feature}}, covering unit, integration, API, security, regression and production-readiness checks." },
      { agentId: "documenter", skillIds: ["research"], objective: "Create the release checklist and technical handoff for {{feature}}. Mark pending verification explicitly." }
    ]
  },
  {
    id: "production-incident-response",
    name: "Production Incident Response",
    category: "engineering",
    description: "Structure an incident investigation without claiming a fix before verification.",
    outcome: "Evidence-backed hypotheses, containment plan, remediation plan and verification criteria.",
    inputs: ["incident", "environment", "recentChanges"],
    tasks: [
      { agentId: "researcher", skillIds: ["research"], objective: "Investigate {{incident}} in {{environment}} using recent changes {{recentChanges}}. Produce evidence-based hypotheses and label uncertainty." },
      { agentId: "architect", skillIds: ["software-delivery"], objective: "Design a safe remediation plan for {{incident}}, including containment, diagnosis, rollback options, recovery and prevention." },
      { agentId: "qa", skillIds: ["quality-gate"], objective: "Define reproducible verification tests proving whether the remediation resolves {{incident}} without regressions." },
      { agentId: "documenter", skillIds: ["research"], objective: "Prepare an incident report structure covering timeline, evidence, confirmed cause, remediation, verification and follow-up actions." }
    ]
  }
];

function interpolate(value: string, vars: Record<string, unknown>) {
  return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => String(vars[key] ?? "[missing:" + key + "]"));
}

export function listObjectiveTemplates() {
  return templates.map(({ tasks, ...meta }) => ({ ...meta, taskCount: tasks.length }));
}

export function getObjectiveTemplate(id: string) {
  return templates.find((template) => template.id === id);
}

export function instantiateObjectiveTemplate(id: string, variables: Record<string, unknown>) {
  const template = getObjectiveTemplate(id);
  if (!template) throw new Error("Objective template not found: " + id);
  const missing = template.inputs.filter((key) => variables[key] === undefined || String(variables[key]).trim() === "");
  if (missing.length) throw new Error("Missing template inputs: " + missing.join(", "));
  return {
    templateId: template.id,
    name: template.name,
    outcome: template.outcome,
    tasks: template.tasks.map((task) => ({
      agentId: task.agentId,
      objective: interpolate(task.objective, variables)
    }))
  };
}
