import type { FilterBuildIssue, FilterBuildResult, IssueCode, PayloadFilterValue, TaskFilterConfig } from "./types.js";

type IssueFactory = (code: IssueCode, message: string) => FilterBuildIssue;

// Insertion order follows the Kotlin parser's operator precedence.
const tokens = {
  eq: "=",
  like: "%",
  gt: ">",
  lt: "<",
  between: "[]",
} as const;

export function serialize(filters: readonly TaskFilterConfig<string>[]): FilterBuildResult {
  const output: string[] = [];
  const issues: FilterBuildIssue[] = [];

  for (let index = 0; index < filters.length; index++) {
    const filterEntry = filters[index]!;

    const values = filterEntry.operator === "between" ? filterEntry.value : [filterEntry.value];
    if (values.every(isBlank)) {
      continue;
    }

    const createIssue: IssueFactory = (code, message) => ({ index, field: filterEntry.field, code, message });
    const result = serializeFilterEntry(filterEntry, createIssue);

    if (isFilterBuildIssue(result)) {
      issues.push(result);
    } else {
      output.push(result);
    }
  }

  return issues.length ? { success: false, issues } : { success: true, filters: output };
}

function serializeFilterEntry(filterEntry: TaskFilterConfig<string>, createIssue: IssueFactory): string | FilterBuildIssue {
  const payloadPrefix = "payload.";
  const isPayload = filterEntry.field.startsWith(payloadPrefix);
  const name = isPayload ? filterEntry.field.slice(payloadPrefix.length) : filterEntry.field;

  let token: string = tokens[filterEntry.operator];
  let serializedValue: string | FilterBuildIssue;

  if (filterEntry.operator === "between") {
    const [from, to] = filterEntry.value;

    if (isBlank(from)) {
      token = tokens.lt;
      serializedValue = serializeScalar(to, createIssue);
    } else if (isBlank(to)) {
      token = tokens.gt;
      serializedValue = serializeScalar(from, createIssue);
    } else {
      serializedValue = serializeRange(filterEntry.value, createIssue);
    }
  } else {
    serializedValue = serializeScalar(filterEntry.value, createIssue);
  }

  if (isFilterBuildIssue(serializedValue)) {
    return serializedValue;
  }

  if (!isParserCompatible(name, token, serializedValue)) {
    return createIssue("UNREPRESENTABLE_FILTER", "Filter contains conflicting operator separators.");
  }

  return `${name}${token}${serializedValue}`;
}

function serializeScalar(value: PayloadFilterValue | Date, createIssue: IssueFactory): string | FilterBuildIssue {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      return createIssue("INVALID_VALUE", "Expected a valid Date.");
    }

    return value.toISOString();
  }

  return String(value);
}

function serializeRange(
  value: readonly [PayloadFilterValue | Date, PayloadFilterValue | Date],
  createIssue: IssueFactory,
): string | FilterBuildIssue {
  const from = serializeScalar(value[0], createIssue);

  if (isFilterBuildIssue(from)) {
    return from;
  }

  const to = serializeScalar(value[1], createIssue);

  if (isFilterBuildIssue(to)) {
    return to;
  }

  if (from.includes("|") || to.includes("|")) {
    return createIssue("INVALID_RANGE", "Range bounds cannot contain '|'.");
  }

  return `${from}|${to}`;
}

function isParserCompatible(attributeName: string, token: string, value: string): boolean {
  const serializedFilterEntry = `${attributeName}${token}${value}`;

  // The Kotlin parser checks operators in precedence order (=, %, >, <, []), not by position.
  // For a like filter with value "Sales=Europe", "task.name%Sales=Europe" would select =
  // instead of the intended %, so reject it when chosenToken differs from token.
  const tokenByPrecedence = Object.values(tokens).find((token) => serializedFilterEntry.includes(token));

  // An eq filter with value "Sales=Europe" produces "task.name=Sales=Europe".
  // Splitting on = yields three segments; the parser requires exactly two.
  const segments = serializedFilterEntry.split(token);
  return tokenByPrecedence === token && segments.length === 2;
}

function isFilterBuildIssue(result: string | FilterBuildIssue): result is FilterBuildIssue {
  return typeof result !== "string" && "code" in result;
}

function isBlank(value: unknown): boolean {
  return typeof value === "string" && value.trim() === "";
}
