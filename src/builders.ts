import { serialize } from "./serialize.js";
import type { DataFilterConfig, FilterBuildResult, TaskFilterConfig } from "./types.js";

export class TaskFilterQueryBuilder<TPayloadAttributeNames extends string = never> {
  build(filters: readonly TaskFilterConfig<TPayloadAttributeNames>[]): FilterBuildResult {
    return serialize(filters);
  }
}

/** Creates task filters, omitting blank values and reporting unrepresentable criteria. */
export function createTaskFilterQuery<TPayloadAttributeNames extends string = never>(
  filters: readonly TaskFilterConfig<TPayloadAttributeNames>[],
): FilterBuildResult {
  return serialize(filters);
}

export class DataFilterQueryBuilder<TPayloadAttributeNames extends string = never> {
  build(filters: readonly DataFilterConfig<TPayloadAttributeNames>[]): FilterBuildResult {
    return serialize(filters);
  }
}

/** Creates data entry filters, omitting blank values and reporting unrepresentable criteria. */
export function createDataFilterQuery<TPayloadAttributeNames extends string = never>(
  filters: readonly DataFilterConfig<TPayloadAttributeNames>[],
): FilterBuildResult {
  return serialize(filters);
}
