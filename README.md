# Polyflow filter query builder

Type-safe builders for [Polyflow's View API filter DSL](https://www.holunda.io/camunda-bpm-taskpool/3.11.0/reference-guide/components/view-api.html).

The library produces filter strings. Whether an attribute, operator, or value is supported by a particular View API implementation is the backend's responsibility.

## Installation

```sh
npm install @polyflow-info/filter-query-builder
```

This package exposes an ESM entry point with TypeScript declarations and has no runtime dependencies.

## Usage

```ts
import {
  createDataFilterQuery,
  createTaskFilterQuery,
} from "@polyflow-info/filter-query-builder";

type PayloadName = "currency" | "customer.name";

const taskFilterQuery = createTaskFilterQuery<PayloadName>([
  { field: "task.priority", operator: "eq", value: 50 },
  { field: "payload.currency", operator: "eq", value: "EUR" },
  { field: "payload.customer.name", operator: "like", value: "Smith" },
]);

if (taskFilterQuery.success) {
  // Supply these filters to your application's View API endpoint.
  console.log(taskFilterQuery.filters);
  // ["task.priority=50", "currency=EUR", "customer.name%Smith"]
} else {
  console.error(taskFilterQuery.issues);
}

const dataFilterQuery = createDataFilterQuery<PayloadName>([
  { field: "data.entryType", operator: "eq", value: "approvalRequest" },
  { field: "payload.customer.name", operator: "like", value: "Smith" },
]);

if (dataFilterQuery.success) {
  console.log(dataFilterQuery.filters);
  // ["data.entryType=approvalRequest", "customer.name%Smith"]
} else {
  console.error(dataFilterQuery.issues);
}
```

`createDataFilterQuery` accepts Data Entry attributes and declared payload names. `createTaskFilterQuery` also accepts task attributes and Data Entry attributes for queries with correlated data entries. Built-in fields are typed; custom payload fields use the `payload.` prefix, which is removed from the output. Field names are supplied by application code and are not validated at runtime.

For repeated calls with the same payload names, the classes bind that type once:

```ts
import {
  DataFilterQueryBuilder,
  TaskFilterQueryBuilder,
} from "@polyflow-info/filter-query-builder";

type PayloadName = "currency" | "customer.name";

const taskFilterQueryBuilder = new TaskFilterQueryBuilder<PayloadName>();

taskFilterQueryBuilder.build([
  { field: "payload.currency", operator: "eq", value: "EUR" },
]);

const dataFilterQueryBuilder = new DataFilterQueryBuilder<PayloadName>();

dataFilterQueryBuilder.build([
  { field: "data.entryType", operator: "eq", value: "approvalRequest" },
]);
```

## Operators, blank values, and ranges

| Operator  | DSL token | Input shape                           |
| --------- | --------- | ------------------------------------- |
| `eq`      | `=`       | Scalar                                |
| `like`    | `%`       | String pattern                        |
| `lt`      | `<`       | Scalar                                |
| `gt`      | `>`       | Scalar                                |
| `between` | `[]`      | Tuple of two bounds, joined with `\|` |

All operators are available for built-in fields. The configuration types retain field/value relationships; backend support and comparison semantics can vary.

Empty or whitespace-only scalar strings are omitted. `0` and `false` are preserved. For ranges:

| Bounds       | Output            |
| ------------ | ----------------- |
| `[from, to]` | `field[]from\|to` |
| `["", to]`   | `field<to`        |
| `[from, ""]` | `field>from`      |
| `["", ""]`   | Filter omitted    |

Whitespace-only strings count as blank bounds too. One-sided comparisons are strict: the populated boundary is excluded. Range ordering is preserved without validation.

## Validation

Timestamp strings pass through unchanged. Use complete ISO timestamps with seconds and `Z` or an explicit offset, such as `2026-11-25T12:34:56Z` or `2026-11-25T13:34:56+01:00`. `Date` objects are converted using `toISOString()`; strings are not normalized or converted through JavaScript's `Date`.

The builder reports only serialization problems:

- `INVALID_VALUE`: an invalid `Date` cannot be converted to ISO text.
- `INVALID_RANGE`: a bound of a two-sided range contains the `|` separator.
- `UNREPRESENTABLE_FILTER`: operator separators would change how the DSL parses the filter.

An issue contains the original input array index, field, code, and message. Failures contain no partial filter array. Otherwise, strings and numbers pass through without domain validation, including non-finite numbers. Null and undefined values are not part of the typed input contract.

## Development

Use Node 26 LTS.

```sh
npm ci
npm run typecheck
npm run test:types
npm run build
npm test
npm pack --dry-run
```

Runtime tests import the build output, so run the build before running them.

See [RELEASING.md](./RELEASING.md) for publishing setup and the release process.

## Releasing

1. Update the package and lockfile versions together:

   ```sh
   npm version <version> --no-git-tag-version
   ```

2. Commit and merge to `main`; wait for CI to pass.
3. Publish a GitHub Release at that commit with tag `v<version>`. Mark it as a prerelease if the version has a prerelease suffix.
4. Wait for the Publish workflow to succeed. It checks version alignment, builds, runs tests, packs, and publishes to npm. Stable releases use `latest`; prereleases use `next`.

Publishing a GitHub Release triggers publication; pushing a commit or tag alone does not.
