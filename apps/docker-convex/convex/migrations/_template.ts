// apps/docker-convex/convex/migrations/_template.ts
// Template for new migrations
// Copy this file and rename with pattern: NN_YYYY_MM_DD_description.ts
// Update the date and description accordingly

import { Migrations } from "@convex-dev/migrations";
import { components } from "../_generated/api.js";
import { DataModel } from "../_generated/dataModel.js";

const migrations = new Migrations<DataModel>(components.migrations);

export const yourMigrationName = migrations.define({
  table: "rag_documents", // Use actual table name from schema
  migrateOne: async (ctx, document) => {
    // Add your migration logic here
    // Example:
    // if (document.missingField === undefined) {
    //   return { missingField: "default_value" };
    // }
    
    // Return updates if any changes are needed, or undefined for no changes
    return undefined;
  },
  
  // Optional: Use custom range for partial migrations
  // customRange: (query) => 
  //   query.withIndex("by_status", (q) => q.eq("status", "pending")),
});