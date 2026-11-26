# Development

Use Node 26 LTS.

```sh
npm install
npm run typecheck
npm run test:types
npm run build
npm test
npm pack --dry-run
```

Runtime tests import the build output, so run the build before running them.
