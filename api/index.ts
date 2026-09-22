import { app } from "../server";

/**
 * Vercel serverless entrypoint.
 *
 * The application keeps a single Express API surface for local and hosted
 * execution. Long-running mission orchestration should use the persistent
 * queue/storage adapters when configured; this entrypoint only owns the HTTP
 * request lifecycle.
 */
export default app;
