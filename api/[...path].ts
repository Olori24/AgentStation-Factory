import { app } from "../server";

/**
 * Vercel catch-all function for nested Express API routes.
 *
 * Without this route, api/index.ts only handles the /api entry point and
 * requests such as /api/auth/me, /api/auth/signup, and /api/auth/login
 * return Vercel's platform-level 404 before Express can handle them.
 */
export default app;
