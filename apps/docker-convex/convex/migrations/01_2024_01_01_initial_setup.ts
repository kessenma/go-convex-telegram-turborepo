// apps/docker-convex/convex/migrations/01_2024_01_01_initial_setup.ts
import { Migrations } from "@convex-dev/migrations";
import { components } from "../_generated/api.js";
import { DataModel } from "../_generated/dataModel.js";

const migrations = new Migrations<DataModel>(components.migrations);

export const initialSetup = migrations.define({
  table: "rag_documents",
  migrateOne: async (ctx, document) => {
    // No changes needed for initial setup
    return undefined;
  },
});