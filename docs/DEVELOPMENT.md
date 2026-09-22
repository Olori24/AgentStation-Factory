# AgentStation Factory Development

## Branch flow

- `development` is the integration branch for ongoing AgentStation Factory work.
- Changes are validated before promotion to `main`.
- `main` is the production branch connected to the AgentStation Factory Vercel project.

## Release rule

1. Build and test on development.
2. Open a pull request from development to main.
3. Merge only after validation.
4. Vercel production deployment is triggered from main.

This document establishes the branch contract without changing runtime behavior.
