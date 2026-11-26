# Releasing

1. Update the package and lockfile versions together:

   ```sh
   npm version <version> --no-git-tag-version
   ```

2. Commit and merge to `main`; wait for CI to pass.
3. Publish a GitHub Release at that commit with tag `v<version>`. Mark it as a prerelease if the version has a prerelease suffix.
4. Wait for the Publish workflow to succeed. It checks version alignment, builds, runs tests, packs, and publishes to npm. Stable releases use `latest`; prereleases use `next`.

Publishing a GitHub Release triggers publication; pushing a commit or tag alone does not.
