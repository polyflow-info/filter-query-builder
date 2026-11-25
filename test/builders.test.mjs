import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDataFilterQuery,
  createTaskFilterQuery,
  DataFilterQueryBuilder,
  TaskFilterQueryBuilder,
} from "../dist/index.js";

test("omits blank scalar values and ranges with both bounds blank, preserving zero and false", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.name", operator: "eq", value: "" },
    { field: "task.name", operator: "like", value: " \t\n" },
    { field: "task.dueDate", operator: "eq", value: "" },
    { field: "payload.cost", operator: "between", value: ["", ""] },
    { field: "task.dueDate", operator: "between", value: ["  ", "\t"] },
    { field: "task.priority", operator: "eq", value: 0 },
    { field: "task.deleted", operator: "eq", value: false },
  ]), { success: true, filters: ["task.priority=0", "task.deleted=false"] });
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.name", operator: "eq", value: "" },
  ]), { success: true, filters: [] });
});

test("converts one-sided ranges to strict comparisons", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.dueDate", operator: "between", value: ["", "2026-01-01T00:00:00Z"] },
    { field: "task.dueDate", operator: "between", value: ["2026-01-01T00:00:00Z", ""] },
    { field: "payload.cost", operator: "between", value: [" ", 0] },
    { field: "payload.flag", operator: "between", value: [false, ""] },
    { field: "task.dueDate", operator: "between", value: [" \t", new Date("2026-01-01T00:00:00Z")] },
    { field: "task.dueDate", operator: "between", value: [new Date("2026-01-01T00:00:00Z"), " \t"] },
  ]), { success: true, filters: [
    "task.dueDate<2026-01-01T00:00:00Z",
    "task.dueDate>2026-01-01T00:00:00Z",
    "cost<0",
    "flag>false",
    "task.dueDate<2026-01-01T00:00:00.000Z",
    "task.dueDate>2026-01-01T00:00:00.000Z",
  ] });
});

test("checks the resulting operator for separator collisions in one-sided ranges", () => {
  const result = createTaskFilterQuery([
    { field: "task.dueDate", operator: "between", value: ["", ""] },
    { field: "payload.name", operator: "between", value: ["", "a<b"] },
    { field: "payload.name", operator: "between", value: ["a>b", ""] },
    { field: "payload.name", operator: "between", value: ["", "a>b"] },
  ]);
  assert.equal(result.success, false);
  assert.equal("filters" in result, false);
  assert.deepEqual(result.issues.map(({ index, code }) => ({ index, code })), [
    { index: 1, code: "UNREPRESENTABLE_FILTER" },
    { index: 2, code: "UNREPRESENTABLE_FILTER" },
    { index: 3, code: "UNREPRESENTABLE_FILTER" },
  ]);
});

test("rejects invalid Dates in either populated range bound", () => {
  for (const value of [["", new Date(NaN)], [new Date(NaN), ""]]) {
    const result = createTaskFilterQuery([{ field: "task.dueDate", operator: "between", value }]);
    assert.equal(result.success, false);
    assert.equal(result.issues[0].code, "INVALID_VALUE");
  }
});

test("strips the payload prefix without validating the field name", () => {
  for (const field of ["payload.", "payload.  ", "payload.task.name", "payload.data.entryId", "payload. task.name "]) {
    const result = createTaskFilterQuery([{ field, operator: "eq", value: "x" }]);
    assert.deepEqual(result, { success: true, filters: [`${field.slice("payload.".length)}=x`] });
  }
});

test("preserves ordinary dotted payload names", () => {
  assert.deepEqual(createDataFilterQuery([
    { field: "payload.customer.name", operator: "like", value: "Smith" },
    { field: "payload.taskName", operator: "eq", value: "Review" },
  ]), { success: true, filters: ["customer.name%Smith", "taskName=Review"] });
});

test("passes timestamp strings through without domain validation", () => {
  for (const value of ["2026-01-01t00:00:00z", "+10000-01-01T00:00:00Z", "backend-value"]) {
    assert.deepEqual(createTaskFilterQuery([
      { field: "task.dueDate", operator: "eq", value },
    ]), { success: true, filters: [`task.dueDate=${value}`] });
  }
});

test("serializes Dates and rejects invalid Dates", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.dueDate", operator: "eq", value: new Date("2026-01-01T00:00:00Z") },
    { field: "task.dueDate", operator: "between", value: [new Date("2026-01-01T00:00:00Z"), "backend-value"] },
  ]), { success: true, filters: ["task.dueDate=2026-01-01T00:00:00.000Z", "task.dueDate[]2026-01-01T00:00:00.000Z|backend-value"] });
  const result = createTaskFilterQuery([
    { field: "task.dueDate", operator: "eq", value: new Date(NaN) },
  ]);
  assert.equal(result.success, false);
  assert.equal(result.issues[0].code, "INVALID_VALUE");
});

test("serializes operators without checking implementation support", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.priority", operator: "like", value: "5" },
    { field: "data.state.processingType", operator: "gt", value: "IN_" },
    { field: "task.name", operator: "between", value: ["A", "Z"] },
    { field: "task.deleted", operator: "like", value: "tru" },
    { field: "task.textSearch", operator: "eq", value: "Review" },
  ]), { success: true, filters: ["task.priority%5", "data.state.processingType>IN_", "task.name[]A|Z", "task.deleted%tru", "task.textSearch=Review"] });
});

test("preserves numeric values and supplied range ordering", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.priority", operator: "eq", value: NaN },
    { field: "task.priority", operator: "gt", value: Infinity },
    { field: "task.priority", operator: "between", value: [20, 10] },
  ]), { success: true, filters: ["task.priority=NaN", "task.priority>Infinity", "task.priority[]20|10"] });
});

test("rejects separator collisions atomically and retains original issue indexes after omissions", () => {
  const result = createTaskFilterQuery([
    { field: "task.name", operator: "eq", value: "" },
    { field: "task.id", operator: "eq", value: "42" },
    { field: "task.name", operator: "like", value: "Sales=Europe" },
    { field: "task.name", operator: "eq", value: "a=b" },
    { field: "payload.cost", operator: "between", value: ["1|2", "3"] },
  ]);
  assert.equal(result.success, false);
  assert.equal("filters" in result, false);
  assert.deepEqual(result.issues.map(({ index, code }) => ({ index, code })), [
    { index: 2, code: "UNREPRESENTABLE_FILTER" },
    { index: 3, code: "UNREPRESENTABLE_FILTER" },
    { index: 4, code: "INVALID_RANGE" },
  ]);
});

test("permits lower-precedence tokens in equality values", () => {
  assert.deepEqual(createTaskFilterQuery([
    { field: "task.name", operator: "eq", value: "a%><[]b" },
  ]), { success: true, filters: ["task.name=a%><[]b"] });
});

test("classes and public functions produce the same results", () => {
  const filters = [{ field: "payload.customer.name", operator: "eq", value: "Alice" }];
  assert.deepEqual(new TaskFilterQueryBuilder().build(filters), createTaskFilterQuery(filters));
  assert.deepEqual(new DataFilterQueryBuilder().build(filters), createDataFilterQuery(filters));
  assert.deepEqual(createTaskFilterQuery([]), { success: true, filters: [] });
});
