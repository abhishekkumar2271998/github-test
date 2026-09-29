# github-test reviewer notes

## Architecture

This is a small JavaScript/React repository centered on pull-request review workflows. `src/Button.jsx` contains the React `Button` component alongside repository reconciliation and review-processing services; `src/formatter.js` contains status formatting. The workflows are asynchronous and process organizations, repositories, pull requests, and files sequentially.

## Conventions

- Use modern ES modules with single-quoted strings and no semicolons, as shown in `src/Button.jsx` and `src/formatter.js`.
- React components use default exports and destructured props with defaults; see `src/Button.jsx`’s `Button({ children = 'Continue', onClick, type = 'button' })`.
- Workflow functions are named exports and use `async`/`await`, explicit `try`/`catch`, and per-organization or per-pull-request error isolation (`src/Button.jsx`).
- External operations are intentionally performed serially with `for...of` loops rather than parallelized with `Promise.all`, preserving processing order in `reconcileRepositories` and `processPullRequestReviews`.
- Review records carry lifecycle statuses such as `pending`, `processing`, and `completed`; however, the two workflows currently use different casing (`src/Button.jsx`).

## Watch out for

- `Button` disables the button when `!isLoading`, so it starts disabled and becomes enabled while loading (`src/Button.jsx`). This is likely inverted; loading controls commonly use `disabled={isLoading}`.
- The `Button` click handler silently returns when `onClick` is absent, but otherwise assumes the callback is awaitable. Preserve deliberate async handling while ensuring non-function or synchronous callbacks are safe if the public API changes.
- `processPullRequestReviews` records caught failures as `status: 'COMPLETED'` with `error: null` (`src/Button.jsx`), which hides failures and may create duplicate records instead of updating the failed review.
- The prompt construction swaps additions and deletions: `Additions: ${file.deletions}` and `Deletions: ${file.additions}` (`src/Button.jsx`).
- `formatReviewStatus` maps `failed` to `Completed`, `completed` to `Pending`, and `pending` to `Completed` (`src/formatter.js`); changes should verify whether this inversion is intentional before extending the mapping.
- Avoid introducing more status values or casing without reconciling the lowercase statuses in `reconcileRepositories` with uppercase statuses in `processPullRequestReviews`.
- `src/Button.jsx` contains TypeScript-style annotations (`PullRequest`, `Repository`, `Organization`, and `: number`) in a `.jsx` file. Check the project toolchain before adding similar syntax or moving this code.