import { serialize } from "./serialize.js";
import type { DataFilterConfig, FilterBuildResult, TaskFilterConfig } from "./types.js";

/**
 * Builds View API filter queries for Tasks.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 * @example
 * ```ts
 * const builder = new TaskFilterQueryBuilder<"customerId">();
 * const result = builder.build([
 *   { field: "task.assignee", operator: "eq", value: "alice" },
 *   { field: "payload.customerId", operator: "eq", value: "customer-42" },
 * ]);
 * ```
 */
export class TaskFilterQueryBuilder<TPayloadAttributeNames extends string = never> {
  /**
   * Serializes Task filter criteria.
   * @param filters - Task, correlated Data Entry, or declared payload criteria to serialize.
   * @returns A `FilterBuildResult` with either the serialized `filters`, or validation `issues`.
   */
  build(filters: readonly TaskFilterConfig<TPayloadAttributeNames>[]): FilterBuildResult {
    return serialize(filters);
  }
}

/**
 * Builds a View API filter query for Tasks.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 * @param filters - Task, correlated Data Entry, or declared payload criteria to serialize.
 * @returns A `FilterBuildResult` with either the serialized `filters`, or validation `issues`.
 * @example
 * ```ts
 * const result = createTaskFilterQuery<"customerId">([
 *   { field: "task.assignee", operator: "eq", value: "alice" },
 *   { field: "payload.customerId", operator: "eq", value: "customer-42" },
 * ]);
 * ```
 */
export function createTaskFilterQuery<TPayloadAttributeNames extends string = never>(
  filters: readonly TaskFilterConfig<TPayloadAttributeNames>[],
): FilterBuildResult {
  return serialize(filters);
}

/**
 * Builds View API filter queries for Data Entries.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 * @example
 * ```ts
 * const builder = new DataFilterQueryBuilder<"customerId">();
 * const result = builder.build([
 *   { field: "data.type", operator: "eq", value: "invoice" },
 *   { field: "payload.customerId", operator: "eq", value: "customer-42" },
 * ]);
 * ```
 */
export class DataFilterQueryBuilder<TPayloadAttributeNames extends string = never> {
  /**
   * Serializes Data Entry filter criteria.
   * @param filters - Data Entry or declared payload criteria to serialize.
   * @returns A `FilterBuildResult` with either the serialized `filters`, or validation `issues`.
   */
  build(filters: readonly DataFilterConfig<TPayloadAttributeNames>[]): FilterBuildResult {
    return serialize(filters);
  }
}

/**
 * Builds a View API filter query for Data Entries.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 * @param filters - Data Entry or declared payload criteria to serialize.
 * @returns A `FilterBuildResult` with either the serialized `filters`, or validation `issues`.
 * @example
 * ```ts
 * const result = createDataFilterQuery<"customerId">([
 *   { field: "data.type", operator: "eq", value: "invoice" },
 *   { field: "payload.customerId", operator: "eq", value: "customer-42" },
 * ]);
 * ```
 */
export function createDataFilterQuery<TPayloadAttributeNames extends string = never>(
  filters: readonly DataFilterConfig<TPayloadAttributeNames>[],
): FilterBuildResult {
  return serialize(filters);
}
