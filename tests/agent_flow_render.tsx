/**
 * Render-level verification for the guided agent creation flow.
 *
 * Renders the real components to static markup and asserts the essential
 * path is present and the advanced configuration is collapsed by default.
 * This is a behavioural check of the actual implementation, not a mock.
 *
 * Run: npx tsx tests/agent_flow_render.tsx
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentCreationFlow } from '../src/components/AgentCreationFlow';
import { AgentManager } from '../src/components/AgentManager';
import { Disclosure, StatTile } from '../src/components/ui';
import { DEFAULT_AGENTS } from '../src/data/defaults';
import {
  AGENT_PRESETS,
  createDraftFromPreset,
  draftToAgentProfile,
  hasErrors,
  validateDraft,
} from '../src/data/agentPresets';

let failures = 0;
function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  \u2713 ${name}`);
  } else {
    console.error(`  \u2717 ${name}`);
    failures++;
  }
}

console.log('Agent creation flow \u2014 render & logic verification\n');

/* 1. Step 1 renders the essential path and the templates. */
const step1 = renderToStaticMarkup(
  React.createElement(AgentCreationFlow, { isOpen: true, onClose: () => {}, onCreated: () => {} })
);
console.log('Step 1 (what it does):');
check('renders the "New agent" title', step1.includes('New agent'));
check('shows the progress indicator', step1.includes('Creation progress'));
check('offers templates', step1.includes('Start from a template'));
check('shows the essential name field', step1.includes('Agent name'));
check('shows the essential role field', step1.includes('Role'));
check('shows the essential goal field', step1.includes('What should it do?'));
check('does NOT show advanced model selection on step 1', !step1.includes('Creativity'));
check('does NOT show tool selection on step 1', !step1.includes('What can it use?'));

/* 2. Advanced configuration is collapsed by default (progressive disclosure). */
const collapsed = renderToStaticMarkup(
  React.createElement(
    Disclosure,
    { title: 'Advanced behaviour', open: false, onToggle: () => {} },
    React.createElement('span', null, 'ADVANCED_BODY')
  )
);
check('advanced section is collapsed by default', collapsed.includes('aria-expanded="false"'));
check('collapsed section hides its body', !collapsed.includes('ADVANCED_BODY'));

const expanded = renderToStaticMarkup(
  React.createElement(
    Disclosure,
    { title: 'Advanced behaviour', open: true, onToggle: () => {} },
    React.createElement('span', null, 'ADVANCED_BODY')
  )
);
check('expanded section reveals its body', expanded.includes('ADVANCED_BODY'));

/* 3. Validation logic: empty draft fails, filled draft passes. */
console.log('\nValidation:');
const empty = createDraftFromPreset('custom');
check('empty custom draft is invalid', hasErrors(validateDraft(empty)));
check('empty draft reports a name error', Boolean(validateDraft(empty).name));
check('empty draft reports a goal error', Boolean(validateDraft(empty).goal));

const filled = { ...createDraftFromPreset('research') };
check('preset draft is valid out of the box', !hasErrors(validateDraft(filled)));

const tooLong = { ...filled, name: 'x'.repeat(41) };
check('over-long name is rejected', Boolean(validateDraft(tooLong).name));

/* 4. Draft -> AgentProfile mapping preserves the configuration. */
console.log('\nMapping:');
const profile = draftToAgentProfile(filled);
check('maps the name', profile.name === filled.name);
check('maps the role title', profile.roleTitle === filled.roleTitle);
check('maps the goal', profile.goal === filled.goal);
check('maps the tools', JSON.stringify(profile.tools) === JSON.stringify(filled.tools));
check('maps the limits', profile.limits?.maxSteps === filled.limits.maxSteps);
check('maps the selected preset', profile.presetId === filled.presetId);
check('maps the selected writing style', profile.tone === filled.tone);
check('maps the selected autonomy', profile.autonomy === filled.autonomy);
check('uses preset instructions when the draft is blank', draftToAgentProfile({ ...filled, systemPrompt: '   ' }).systemPrompt === AGENT_PRESETS.find((p) => p.id === filled.presetId)?.systemPrompt);
check('is marked as a custom agent', profile.custom === true);
check('has a unique key', typeof profile.key === 'string' && profile.key.length > 0);

/* 5. Every preset produces a valid, complete draft. */
console.log('\nPresets:');
for (const preset of AGENT_PRESETS) {
  const draft = createDraftFromPreset(preset.id);
  const valid = preset.id === 'custom' ? true : !hasErrors(validateDraft(draft));
  check(`preset "${preset.id}" produces a valid draft`, valid);
}

/* 6. Agent manager renders the squad and the create entry. */
console.log('\nAgent manager:');
const manager = renderToStaticMarkup(
  React.createElement(AgentManager, {
    isOpen: true,
    onClose: () => {},
    agents: DEFAULT_AGENTS,
    onCreateAgent: () => {},
  })
);
check('renders the "My agents" title', manager.includes('My agents'));
check('lists the built-in squad', manager.includes('Atlas') && manager.includes('Cypher'));
check('offers a create entry', manager.includes('New agent'));
check('shows a search field', manager.includes('Search agents'));

const informationalTile = renderToStaticMarkup(
  React.createElement(StatTile, { icon: '•', label: 'Files', value: 0 })
);
const actionableTile = renderToStaticMarkup(
  React.createElement(StatTile, { icon: '•', label: 'Missions', value: 1, onClick: () => {} })
);
check('non-actionable stat tiles are not keyboard buttons', !informationalTile.includes('<button'));
check('actionable stat tiles remain keyboard buttons', actionableTile.includes('<button'));

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} \u2014 ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
