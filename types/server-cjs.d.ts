declare module "*.cjs" {
  import type { Express } from "express";

  export const app: Express;
}
