import type { DataAttributes, TaskAttributes } from "./attributes.js";

/** Supported values for payload filter criteria. */
export type PayloadFilterValue = string | number | boolean;
/** Timestamp filter input as an ISO timestamp string or a Date. */
export type TimestampInput = string | Date;
/** Operators supported by filter criteria. */
export type FilterOperator = "eq" | "like" | "lt" | "gt" | "between";
/** Processing states supported by Data Entry processing-type filters. */
export type ProcessingType = "PRELIMINARY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "UNDEFINED" | "DELETED";

type Comparison<Value> = {
  readonly operator: "lt" | "gt";
  readonly value: Value;
};
type Range<Value> = {
  readonly operator: "between";
  /** A blank bound produces lt/gt; two blank bounds omit the filter. */
  readonly value: readonly [Value | "", Value | ""];
};
type Like = {
  readonly operator: "like";
  readonly value: string;
};
type Equality<Value> = {
  readonly operator: "eq";
  readonly value: Value;
};

// String comparisons also support partial values (for example enum prefixes).
type Operations<Value> = Equality<Value> | Like
  | Comparison<Value extends string ? string : Value>
  | Range<Value extends string ? string : Value>;

type AttributeValues = {
  text: string;
  integer: number;
  timestamp: TimestampInput;
  boolean: boolean;
  processing: ProcessingType;
};

type BuiltInConfig<Attributes extends Record<string, keyof AttributeValues>> = {
  [Field in keyof Attributes]: { readonly field: Field } & Operations<AttributeValues[Attributes[Field]]>;
}[keyof Attributes];

type PayloadConfig<Names extends string> = {
  readonly field: `payload.${Names}`;
} & Operations<PayloadFilterValue>;

/**
 * A filter criterion for Task fields, correlated Data Entry fields, or declared payload names.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 */
export type TaskFilterConfig<TPayloadAttributeNames extends string = never> =
  BuiltInConfig<TaskAttributes> | BuiltInConfig<DataAttributes> | PayloadConfig<TPayloadAttributeNames>;

/**
 * A filter criterion for Data Entry fields or declared payload names.
 * @typeParam TPayloadAttributeNames - Allowed payload attribute names without the `payload.` prefix.
 */
export type DataFilterConfig<TPayloadAttributeNames extends string = never> = BuiltInConfig<DataAttributes> | PayloadConfig<TPayloadAttributeNames>;

/** First validation failure for a criterion; index refers to the input array. */
export interface FilterBuildIssue {
  readonly index: number;
  readonly field: string;
  readonly code: "INVALID_VALUE" | "INVALID_RANGE" | "UNREPRESENTABLE_FILTER";
  readonly message: string;
}

/** Code identifying the kind of filter validation failure. */
export type IssueCode = FilterBuildIssue["code"];

/**
 * A result object containing `success: true` with serialized `filters`, or `success: false` with validation `issues`.
 * Blank filters are omitted; one-sided ranges become lt/gt; failure never exposes partial filters.
 */
export type FilterBuildResult =
  { readonly success: true; readonly filters: string[] } | { readonly success: false; readonly issues: readonly FilterBuildIssue[] };
