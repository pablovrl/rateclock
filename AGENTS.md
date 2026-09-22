# Worktime project instructions

## Project specification

- Read `docs/specification.md` before planning or implementing project functionality.
- Treat it as the source of truth for the product scope, business rules, data model, and technical direction.
- Do not expand the documented scope without explicit user approval.

## Collaboration

- Work in small, independently completable increments.
- Implement only one task or feature at a time.
- Before modifying files, explain what will change and why, then wait for explicit approval.
- Ask for approval before making architectural decisions or installing dependencies.
- When multiple reasonable approaches exist, briefly explain their tradeoffs.
- After each change, list the modified files and explain the relevant code.
- Add tests when appropriate and explain what they verify.
- Ask the user to run or inspect the result before continuing.
- Do not automatically proceed to the next increment.
- Keep changes and commits small and easy to review.
- Do not create commits unless the user explicitly asks.
- Explain important concepts rather than hiding them behind generated code.

## Technical conventions

- Use pnpm as the package manager.
- Use strict TypeScript and ECMAScript modules.
- Keep application source code in `src/` and tests in `tests/`.
- Treat `dist/` as generated output; do not edit it directly.
- Use `package.json` as the source of truth for the CLI version.
- Write test suite and test case descriptions in English.
- Follow the existing project structure and naming conventions.

## Verification

- Run `pnpm typecheck` after changing application TypeScript.
- Run `pnpm exec tsc --project tests/tsconfig.json` after changing test TypeScript.
- Run `pnpm test` when behavior or tests change.
- Report which checks were run and whether they passed.
