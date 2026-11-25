import {
  createDataFilterQuery,
  createTaskFilterQuery,
  DataFilterQueryBuilder,
  TaskFilterQueryBuilder,
  type FilterBuildIssue,
  type FilterBuildResult,
  type TaskFilterConfig,
} from "../../src/index.js";

createTaskFilterQuery([
  { field: "task.priority", operator: "like", value: "5" },
  { field: "data.state.processingType", operator: "gt", value: "IN_" },
  { field: "data.state.processingType", operator: "between", value: ["A", "Z"] },
  { field: "task.name", operator: "between", value: ["A", "Z"] },
  { field: "task.deleted", operator: "gt", value: false },
  { field: "task.deleted", operator: "between", value: [false, true] },
  { field: "task.textSearch", operator: "eq", value: "Review" },
  { field: "task.dueDate", operator: "like", value: "2026" },
  { field: "task.dueDate", operator: "between", value: [new Date(), "backend-value"] },
  { field: "task.dueDate", operator: "between", value: ["", new Date()] },
  { field: "task.dueDate", operator: "between", value: [new Date(), ""] },
  { field: "task.priority", operator: "between", value: ["", 0] },
  { field: "task.priority", operator: "between", value: [0, ""] },
  { field: "task.priority", operator: "between", value: ["", ""] },
  { field: "task.deleted", operator: "between", value: [false, ""] },
]);

const filters = [{ field: "payload.customer.name", operator: "eq", value: "Alice" }] as const;
const result: FilterBuildResult = createTaskFilterQuery<"customer.name">(filters);
createDataFilterQuery<"customer.name">(filters);
new TaskFilterQueryBuilder<"customer.name">().build(filters);
new DataFilterQueryBuilder<"customer.name">().build(filters);
if (!result.success) {
  const issue: FilterBuildIssue = result.issues[0]!;
  const code: FilterBuildIssue["code"] = issue.code;
  void code;
}

// @ts-expect-error Data filters do not accept task attributes.
createDataFilterQuery([{ field: "task.name", operator: "eq", value: "Alice" }]);
// @ts-expect-error Declared payload names remain checked.
createTaskFilterQuery<"customer.name">([{ field: "payload.typo", operator: "eq", value: "Alice" }]);
// @ts-expect-error Numeric equality retains the built-in value type.
createTaskFilterQuery([{ field: "task.priority", operator: "eq", value: "5" }]);
// @ts-expect-error Processing type equality retains enum completion and checking.
createDataFilterQuery([{ field: "data.state.processingType", operator: "eq", value: "TYPO" }]);
// @ts-expect-error Between requires exactly two bounds.
createTaskFilterQuery([{ field: "task.priority", operator: "between", value: [1] }]);
// @ts-expect-error Scalar operators cannot receive a range tuple.
createTaskFilterQuery([{ field: "task.priority", operator: "eq", value: [1, 2] }]);
// @ts-expect-error Unknown built-in fields remain checked.
const unknown: TaskFilterConfig = { field: "task.typo", operator: "eq", value: "x" };
void unknown;
