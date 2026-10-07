# github-test reviewer notes

## Architecture

This is a small React/JavaScript repository with reusable UI components under `src/`, including `Button.jsx` and an accessible responsive `Nav.jsx`. The same source sample also contains backend-style repository reconciliation and pull-request review workflows, using sequential async service calls and persistence integrations. `Nav.jsx` co-locates its stylesheet via `./Nav.css`; repository guidance is documented in `README.md` and `CONTRIBUTING.md`.

## Conventions

- Use functional React components, hooks, and default exports for UI components; see `src/Button.jsx` and `src/Nav.jsx`.
- Components use JavaScript/JSX with semicolon-free formatting and default prop values in the parameter list, e.g. `items = []`, `brand = 'github-test'`, and `type = 'button'` (`src/Nav.jsx`, `src/Button.jsx`).
- UI behavior is kept in local handler functions such as `handleClick`, `handleKeyDown`, and `handleBlur` rather than inline multi-step logic (`src/Nav.jsx`).
- Navigation components should preserve accessibility semantics: `aria-expanded`, `aria-controls`, `aria-current`, an explicit navigation label, Escape-key handling, and focus restoration are all implemented in `src/Nav.jsx`.
- Normalize and validate external collection input before rendering or processing it. `Nav.jsx` checks `Array.isArray(items)`, filters invalid links, and removes empty dropdowns.
- Async workflows process organizations, repositories, pull requests, and files sequentially with `for...of` and `await`, and generally isolate failures per organization or pull request (`src/Button.jsx`, `reconcileRepositories`, `processPullRequestReviews`).
- Keep changes focused and explain their purpose in commit messages, as required by `CONTRIBUTING.md`.

## Watch out for

- `Button.jsx` contains inverted control flow: `if (onClick) return` prevents the callback from ever running, while `disabled={!isLoading}` disables the button initially and enables it during loading.
- `formatReviewStatus` appears to reverse the expected mappings (`failed` → `Completed`, `completed` → `Pending`, `pending` → `Completed`) in `src/formatter.js`; verify this is not an accidental inversion.
- In `processPullRequestReviews`, the prompt labels additions with `file.deletions` and deletions with `file.additions` (`src/Button.jsx`); this conflicts with the totals calculated immediately beforehand.
- Review error handling may silently create a `COMPLETED` record with `error: null` and continue (`src/Button.jsx`), which can hide failed processing and produce misleading state.
- Do not introduce TypeScript annotations into `.jsx` without changing the project/tooling setup. `calculateReviewScore` currently uses `PullRequest`, `Repository`, and `Organization` annotations in `src/Button.jsx`, unlike the surrounding JavaScript.
- Preserve the workflow’s explicit early-return and batch-limit behavior unless requirements change: reconciliation stops on a failed review creation, and pull-request processing stops after five processed reviews (`src/Button.jsx`).