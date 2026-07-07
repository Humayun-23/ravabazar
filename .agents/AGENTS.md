# AGENTS.md

## Purpose

This file gives instructions to AI coding agents working on this project.

This is a serious paid client project. The agent must stay focused, avoid unnecessary changes, and preserve the agreed project direction.

## Core Rule

Before making any change, understand the current project context.

Always read the available project documentation before implementation, especially:

- `CODEX_PROJECT_CONTEXT.md`
- `docs/scope.md`
- `docs/architecture.md`
- `docs/database-plan.md`
- `docs/api-contract.md`
- `docs/testing-checklist.md`
- Any latest status/progress report file

Do not assume missing requirements.  
Do not silently introduce new architecture decisions.  
Do not overbuild features that were not requested.

## Work Style

Work phase by phase.

Only implement the task that was explicitly requested.

Avoid unrelated changes, refactors, renaming, restructuring, or dependency additions unless they are necessary for the requested task.

If a change affects API behavior, database design, authentication, deployment, or business logic, update the relevant documentation.

Prefer clean, readable, maintainable production code over clever abstractions.

Don't make unnecessary functions/class.

## Business Logic Rules

The following rules must not be violated:

- Never reduce inventory from the frontend.
- Never reduce inventory when a product is added to cart.
- Always validate stock on the backend during checkout/order creation.
- Never mark payment successful from frontend response alone.
- Payment success must be verified on the backend.
- Payment webhooks must be verified securely.
- Product snapshot must be stored in order items.
- Address snapshot must be stored in orders.
- Admin APIs must be protected.
- Customer tokens and admin tokens must not be confused.
- Secrets must never be committed.
- Real `.env` files must not be committed.
- PostgreSQL must not be exposed publicly in production.
- Uploaded product images must not be stored permanently inside Docker containers.

# Project Rules

- From now onwards, every test script, mock, or testing file should be written exclusively inside the `tests` directory (e.g., `backend/tests/`). Do not create loose test files like `test_models.py` in the root directories.
- Keep in mind that the long-term goal is to port this frontend as an Android application using Capacitor. Ensure that frontend code (like storage access, routing, and APIs) remains compatible with this constraint where possible.

## Implementation Discipline

Before implementation:

1. Inspect the existing code.
2. Identify the minimal files that need changes.
3. Avoid touching unrelated modules.
4. Check the `/Users/humayun/ravabazar/docs/api-contract.md` before making any api changes.

During implementation:

1. Keep code consistent with the existing style.
2. Reuse existing utilities, schemas, dependencies, and conventions.
3. Add validation where needed.
4. Add or update tests for important behavior.
5. Update docs when behavior changes.

After implementation:

1. Run relevant tests if possible.
2. Check for obvious import/type/runtime errors.
3. Ensure no secrets or generated junk files were added.
4. Provide a clear implementation summary.
5. Update the documentation in /docs if it requires changes.

## Required Summary After Every Implementation

After completing any implementation, provide a final summary in this exact format:

```md
## Implementation Summary

### What was changed
- List the main changes made.

### Files modified
- List each changed file with a short reason.

### Behavior added or updated
- Explain what the system can now do.

### Tests
- Mention tests added or updated.
- Mention whether tests were run.
- If tests were not run, explain why.

### Documentation updates
- Mention docs updated.
- If no docs were updated, explain why.

### Important notes
- Mention any assumptions, risks, or follow-up tasks.
