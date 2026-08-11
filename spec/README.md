# Local Speckit Scaffolding

This workspace includes a local, self-contained spec-driven development scaffold modeled after Speckit workflows.
It does not require the GitHub `spec-kit` CLI or any external tooling beyond Node.

## What it includes

- `spec/constitution.md` — the local Speckit constitution and workflow rules.
- `spec/speckit.js` — an interactive local agent for clarifying requirements, generating a spec, and planning implementation.
- `spec/templates/spec-template.md` — a reusable spec template for consistent outputs.

## Run it locally

Install dependencies if needed:

```bash
npm install
```

Run the local Speckit agent:

```bash
npm run speckit
```

Then follow the interactive prompts.

## Workflow

1. Clarify requirements with structured questions.
2. Generate a spec from the clarified information.
3. Create an implementation plan with explicit tasks.
4. Review the generated outputs and use them as the source of truth.

## Output files

The tool saves generated documents under `spec/outputs/`:

- `clarified-<slug>.md`
- `spec-<slug>.md`
- `implementation-plan-<slug>.md`

## Example

Start the tool and choose:

- `1` to clarify a new requirement.
- `2` to generate a spec from clarified details.
- `3` to produce an implementation plan.
- `4` to review generated outputs.
- `5` to exit.
