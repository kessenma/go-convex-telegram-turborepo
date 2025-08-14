// This file is used to import and register all migrations
// The migrations are automatically registered when imported

import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

import "./migrations/01_2024_01_01_initial_setup";