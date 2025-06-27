/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as telegram from "../../../docker-convex/convex/telegram.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage for example:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const api: FilterApi<
  ApiFromModules<{
    telegram: typeof telegram;
  }>,
  FunctionReference<any, "public">
>;
export { api };

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage for example:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const internal: FilterApi<
  ApiFromModules<{
    telegram: typeof telegram;
  }>,
  FunctionReference<any, "internal">
>;
export { internal };