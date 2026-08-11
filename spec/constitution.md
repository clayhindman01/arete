# Arete Local Speckit Constitution

This constitution defines the local spec-driven workflow for Arete.
It is designed to keep development focused on clear requirements, explicit acceptance criteria, and implementation driven by a living spec.

## Principles

- Clarify first: never start implementation without a clear, shared understanding of the problem.
- Specify the minimum viable behavior in concrete acceptance criteria.
- Keep the spec lightweight, actionable, and easy to update.
- Use the spec as the contract for both design and implementation.
- Treat the spec as a first-class artifact, not a byproduct.
- Iterate by refining the spec before changing code.

## Workflow

1. Clarify requirements.
   - Ask the right questions.
   - Capture user intent, scope, success criteria, and constraints.
2. Generate the spec.
   - Turn clarified requirements into a structured specification.
   - Define user stories, acceptance criteria, non-goals, and edge cases.
3. Plan implementation.
   - Break the spec into concrete tasks.
   - Identify what needs to be built and how it will be verified.
4. Implement intentionally.
   - Write code that directly satisfies the spec.
   - Avoid guessing about behavior.
5. Validate and iterate.
   - Review the spec against the implementation.
   - Update the spec if requirements change.

## Speckit Style Rules

- Use a shared document as the source of truth.
- Keep questions and answers explicit.
- Capture assumptions and open questions.
- Prefer simple edges and clear acceptance criteria.
- Document what is out of scope.
- Do not start coding until the spec is stable enough to guide implementation.
