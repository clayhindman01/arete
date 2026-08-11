const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.join(__dirname);
const outputsDir = path.join(rootDir, 'outputs');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function ask(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (value) => resolve(value.trim()));
  });
}

async function askMultiline(rl, prompt) {
  console.log(prompt);
  console.log('(Enter multiple lines. Finish with an empty line.)');
  const lines = [];
  while (true) {
    const line = await ask(rl, '> ');
    if (!line) break;
    lines.push(line);
  }
  return lines;
}

function buildClarificationMarkdown(data) {
  return `# Clarified Requirements

## Feature Overview

- **Feature**: ${data.feature}
- **User**: ${data.user}
- **Problem**: ${data.problem}
- **Success**: ${data.success}

## Scope

- **In Scope**:
${data.scope.map((item) => `  - ${item}`).join('\n') || '  - (none)'}

- **Out of Scope**:
${data.nonGoals.map((item) => `  - ${item}`).join('\n') || '  - (none)'}

## Acceptance Criteria

${data.acceptanceCriteria.map((item) => `- ${item}`).join('\n') || '- (none)'}

## Constraints and Assumptions

${data.constraints.map((item) => `- ${item}`).join('\n') || '- (none)'}

## Open Questions

${data.questions.map((item) => `- ${item}`).join('\n') || '- (none)'}
`;
}

function buildSpecMarkdown(data) {
  return `# Specification

## Summary

- **Feature**: ${data.feature}
- **User**: ${data.user}
- **Goal**: ${data.goal}
- **Success**: ${data.success}

## User Story

As a ${data.user}, I want ${data.feature} so that ${data.problem}.

## Acceptance Criteria

${data.acceptanceCriteria.map((item) => `- [ ] ${item}`).join('\n')}

## In Scope

${data.scope.map((item) => `- ${item}`).join('\n')}

## Out of Scope

${data.nonGoals.map((item) => `- ${item}`).join('\n')}

## Constraints

${data.constraints.map((item) => `- ${item}`).join('\n')}

## Implementation Notes

${data.notes.length ? data.notes.map((item) => `- ${item}`).join('\n') : '- No implementation notes yet.'}

## Open Questions

${data.questions.length ? data.questions.map((item) => `- ${item}`).join('\n') : '- No open questions.'}
`;
}

function buildPlanMarkdown(data) {
  return `# Implementation Plan

## Goal

- Build the feature: ${data.feature}
- Ensure the behavior matches the spec.

## Tasks

${data.tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

## Test Notes

${data.tests.length ? data.tests.map((item) => `- ${item}`).join('\n') : '- Add validation checks and acceptance tests.'}

## Review Checklist

- [ ] Spec matches requirements
- [ ] All acceptance criteria are addressed
- [ ] Implementation plan is complete
- [ ] Tests are identified
`;
}

function listOutputs() {
  ensureDirectory(outputsDir);
  return fs.readdirSync(outputsDir).filter((file) => file.endsWith('.md'));
}

async function clarifyRequirements(rl) {
  const feature = await ask(rl, 'Feature title: ');
  const user = await ask(rl, 'Primary user or persona: ');
  const problem = await ask(rl, 'Problem we are solving: ');
  const success = await ask(rl, 'How do we know this is successful? ');
  const scope = await askMultiline(rl, 'In-scope items:');
  const nonGoals = await askMultiline(rl, 'Out-of-scope items:');
  const acceptanceCriteria = await askMultiline(rl, 'Acceptance criteria:');
  const constraints = await askMultiline(rl, 'Constraints or assumptions:');
  const questions = await askMultiline(rl, 'Open questions:');

  const data = { feature, user, problem, success, scope, nonGoals, acceptanceCriteria, constraints, questions };
  const slug = slugify(feature || 'requirement');
  const filename = `clarified-${slug}.md`;
  ensureDirectory(outputsDir);
  fs.writeFileSync(path.join(outputsDir, filename), buildClarificationMarkdown(data), 'utf-8');

  console.log(`\nSaved clarified requirements to spec/outputs/${filename}\n`);
  return { data, filename };
}

async function generateSpec(rl) {
  const hasClarified = await ask(rl, 'Use an existing clarified requirements file? (y/N): ');
  let data;

  if (hasClarified.toLowerCase() === 'y') {
    const files = listOutputs().filter((name) => name.startsWith('clarified-'));
    if (!files.length) {
      console.log('No clarified files found. Please clarify requirements first.');
      return;
    }
    console.log('\nAvailable clarified requirement files:');
    files.forEach((file, index) => console.log(`  ${index + 1}. ${file}`));
    const choice = await ask(rl, 'Choose a file number: ');
    const index = Number(choice) - 1;
    if (!files[index]) {
      console.log('Invalid selection.');
      return;
    }
    const fileContents = fs.readFileSync(path.join(outputsDir, files[index]), 'utf-8');
    const parsed = parseClarificationFile(fileContents);
    if (!parsed) {
      console.log('Could not parse the clarified file. Please generate from scratch.');
      return;
    }
    data = parsed;
  } else {
    const result = await clarifyRequirements(rl);
    data = result.data;
  }

  const slug = slugify(data.feature || 'spec');
  const filename = `spec-${slug}.md`;
  ensureDirectory(outputsDir);
  fs.writeFileSync(path.join(outputsDir, filename), buildSpecMarkdown(data), 'utf-8');

  console.log(`\nSaved specification to spec/outputs/${filename}\n`);
}

function parseClarificationFile(fileContents) {
  const lines = fileContents.split(/\r?\n/);
  const data = { feature: '', user: '', problem: '', success: '', scope: [], nonGoals: [], acceptanceCriteria: [], constraints: [], questions: [], notes: [] };
  let section = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      section = line.slice(3);
      continue;
    }
    if (section === 'Feature Overview') {
      if (line.startsWith('- **Feature**:')) data.feature = line.replace('- **Feature**:', '').trim();
      if (line.startsWith('- **User**:')) data.user = line.replace('- **User**:', '').trim();
      if (line.startsWith('- **Problem**:')) data.problem = line.replace('- **Problem**:', '').trim();
      if (line.startsWith('- **Success**:')) data.success = line.replace('- **Success**:', '').trim();
    }
    if (section === 'Scope' || section === 'Acceptance Criteria' || section === 'Constraints and Assumptions' || section === 'Open Questions') {
      if (line.startsWith('- ') || line.startsWith('  - ')) {
        const item = line.replace(/^-\s*/, '').replace(/^\s*-\s*/, '').trim();
        if (section === 'Scope') data.scope.push(item);
        if (section === 'Acceptance Criteria') data.acceptanceCriteria.push(item);
        if (section === 'Constraints and Assumptions') data.constraints.push(item);
        if (section === 'Open Questions') data.questions.push(item);
      }
      if (line.startsWith('- **Out of Scope**:') || line.startsWith('- **In Scope**:')) {
        // skip
      }
      if (line.startsWith('- ')) {
        // no-op
      }
      if (line.startsWith('  - ')) {
        const item = line.replace(/^\s*-\s*/, '').trim();
        if (section === 'Scope') data.scope.push(item);
        if (section === 'Open Questions') data.questions.push(item);
        if (section === 'Acceptance Criteria') data.acceptanceCriteria.push(item);
        if (section === 'Constraints and Assumptions') data.constraints.push(item);
      }
    }
    if (section === 'Out of Scope') {
      if (line.startsWith('- ')) data.nonGoals.push(line.replace('- ', '').trim());
    }
  }

  return data;
}

async function implementationPlan(rl) {
  const feature = await ask(rl, 'Feature title: ');
  const tasks = await askMultiline(rl, 'Implementation tasks:');
  const tests = await askMultiline(rl, 'Test or validation notes:');
  const slug = slugify(feature || 'implementation-plan');
  const filename = `implementation-plan-${slug}.md`;
  ensureDirectory(outputsDir);
  fs.writeFileSync(path.join(outputsDir, filename), buildPlanMarkdown({ feature, tasks, tests }), 'utf-8');
  console.log(`\nSaved implementation plan to spec/outputs/${filename}\n`);
}

async function main() {
  ensureDirectory(outputsDir);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Local Speckit Agent');
  console.log('-------------------');

  while (true) {
    console.log('\nChoose a step:');
    console.log('1) Clarify requirements');
    console.log('2) Generate specification');
    console.log('3) Create implementation plan');
    console.log('4) Review generated outputs');
    console.log('5) Exit');

    const choice = await ask(rl, 'Select a number: ');
    switch (choice.trim()) {
      case '1':
        await clarifyRequirements(rl);
        break;
      case '2':
        await generateSpec(rl);
        break;
      case '3':
        await implementationPlan(rl);
        break;
      case '4': {
        const outputs = listOutputs();
        if (!outputs.length) {
          console.log('No generated files found yet.');
          break;
        }
        console.log('\nGenerated outputs:');
        outputs.forEach((name) => console.log(`  - ${name}`));
        break;
      }
      case '5':
        rl.close();
        console.log('Goodbye.');
        return;
      default:
        console.log('Invalid option. Choose 1-5.');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
