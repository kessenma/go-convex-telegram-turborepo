import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Example query function - replace with your own functions
export const listItems = query({
  args: {},
  handler: async (ctx) => {
    // Example: Get all items from a hypothetical "items" table
    return await ctx.db.query("items").collect();
  },
});

// Example mutation function - replace with your own functions
export const addItem = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Example: Insert a new item into the "items" table
    const itemId = await ctx.db.insert("items", {
      name: args.name,
      description: args.description || "",
      createdAt: Date.now(),
    });
    return itemId;
  },
});

// Example: Delete an item
export const deleteItem = mutation({
  args: {
    id: v.id("items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});