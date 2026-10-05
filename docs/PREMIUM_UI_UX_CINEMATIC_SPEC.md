# AgentStation — Premium UI/UX & Cinematic Experience Specification

**Review date:** 2026-10-05  
**Current stage:** Build / QA  
**Design owner:** AgentStation product/design system  
**Project type:** AI agent workspace / autonomous operations dashboard  
**Primary audience:** Builders, founders, operators, developers, researchers, and technical teams  
**Primary user goal:** Give AgentStation a complex objective and confidently understand what the system is doing, what evidence it produced, and what can be shipped next.  
**Brand position:** Premium technical / cinematic / elite operator console  
**Reference quality bar:** Manus-style task execution, Linear-level hierarchy, Raycast-style command discovery, modern AI-native workspaces.

## Project objective

This product should make users feel **in control, impressed, and confident** while helping them **turn a high-level objective into verified work and usable deliverables**.

## Experience thesis

AgentStation is not a collection of tools. It is an **AI command center**.

The interface should communicate one continuous story:

**OBJECTIVE → ORCHESTRATION → EVIDENCE → DELIVERABLE → ACTION**

Every screen should answer:
1. What did I ask for?
2. What is AgentStation doing now?
3. What has actually been verified?
4. What did I receive?
5. What can I do next?

## Visual direction

### Cinematic, not decorative
- dark near-black foundation
- translucent glass surfaces
- subtle blue/violet atmospheric light
- fine technical grid
- controlled glow around the primary command surface
- high contrast typography
- motion only where it explains system state

Avoid excessive neon, rainbow gradients, ornamental cards, competing accent colours, and constant animation.

### Premium hierarchy
The primary hierarchy is **Mission objective → active agent/system state → execution evidence → generated artifacts → secondary controls**.

### Command surface
The home experience is centered around the objective composer. It should feel like a professional control surface rather than a generic chat box: large intentional typography, generous whitespace, one dominant input, explicit execution CTA, compact capability indicators, keyboard-first command discovery, and quick-start examples below the objective.

### Execution experience
During execution, AgentStation should feel alive but calm. Use stage progression, agent activity stream, elapsed execution time, verified completion states, and terminal telemetry when relevant. Never simulate success; visual success states must map to real persisted mission outcomes.

### Evidence-first delivery
Completed missions should foreground tests passed/failed, generated files, preview, execution output, CI status, and deployment readiness. The user should not need to hunt through menus to determine whether an output is trustworthy.

## Interaction principles

### Jakob's Law
Preserve familiar mental models: command palette (⌘K / Ctrl+K), mission history as left navigation, workspace as main canvas, status as compact persistent indicator, and one prominent primary action.

### Progressive disclosure
Keep the first view simple. Advanced controls such as autonomy, GitHub, model configuration, sandbox and operations belong behind deliberate secondary actions.

### Direct manipulation
Let users open artifacts, inspect code, run verification, preview output, continue the mission, and start a new mission without unnecessary modal chains.

### Feedback
Every asynchronous operation should provide immediate acknowledgement, current state, completion/failure state, and a recovery action when possible.

## Responsive experience

Mobile is a first-class workspace, not a compressed desktop. The objective composer remains dominant; secondary controls collapse into accessible menus; mission history becomes a drawer; execution and deliverables become tabbed views; horizontal scrolling is limited to genuinely horizontal data; touch targets remain comfortable; no critical evidence depends on hover.

## Motion language

Motion should communicate dispatch, progress, verification, completion, and failure. Respect `prefers-reduced-motion`.

## Accessibility

Premium means accessible: visible keyboard focus, semantic buttons and labels, sufficient contrast, `aria-live` for important async state, no information conveyed by colour alone, reduced-motion support, and keyboard-accessible command palette and dialogs.

## Component hierarchy

### Global shell
- AgentStation identity
- mission context
- connection/CI state
- restrained global actions

### Navigation
- New Task
- Command Palette
- Mission History
- Autonomy
- Growth Factory
- integrations/settings

### Home
- identity/status
- objective composer
- capability hints
- quick-start missions
- recent missions

### Mission workspace
- mission header
- five-stage execution rail
- agent activity stream
- follow-up command input
- unified deliverable canvas

### Evidence layer
- tests
- terminal output
- generated artifacts
- CI/deployment state
- security/reliability signals

## Acceptance criteria

- [ ] The primary objective is visually dominant.
- [ ] Secondary controls do not compete with the objective.
- [ ] Execution state is understandable in under five seconds.
- [ ] Completed work exposes evidence, not just a success badge.
- [ ] Failure states explain what happened and what to do next.
- [ ] Mobile remains usable without desktop-only interactions.
- [ ] Keyboard navigation and focus states are intentional.
- [ ] Reduced-motion users receive an equivalent experience.
- [ ] Real mission state drives completion indicators.
- [ ] Visual polish does not weaken security or authorization boundaries.

## Current implementation direction

The current build now establishes the premium foundation through cinematic atmospheric background, technical grid texture, glass command surfaces, restrained illumination, stronger display typography, a premium primary execution CTA, accessible focus treatment, and reduced-motion handling.

Future refinement should prioritize **workspace evidence hierarchy and execution-state clarity** before adding more decorative effects.