# Changesets

This directory is managed by [changesets](https://github.com/changesets/changesets).

## Adding a changeset

Run the following command and follow the prompts:

```bash
npx changeset add
```

This creates a Markdown file here describing what changed and the semver bump level (major / minor / patch).

## Releasing

When merged to `main`, the CI release workflow runs `changeset version` to bump versions and update the changelog, then publishes to npm automatically.
