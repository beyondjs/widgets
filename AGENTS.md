# widgets/widgets agent instructions

Canonical instructions for this repository and its descendants. Tool-specific files must only reference AGENTS.md. This is an independent Git repository; the current coordinated branch is `feature/next`.

Shared Widgets registration, controllers and rendering. Preserve public module identities and framework-neutral lifecycle boundaries.

- Use English for first-party docs, instructions, comments, docstrings and new explanatory text. Preserve intentional locale catalogs, public names/specifiers/paths, protocol keys and functional test values unless a compatibility change is explicitly authorized. Do not rewrite vendor, generated, lockfile or third-party content for language cleanup.
- Preserve current uncommitted work and repository history. Do not commit, push, reset, publish or deploy without explicit task authorization.
- Keep public Beyond module imports distinct from internal relative source imports. Do not silently replace the configured bootstrap, runtime or framework.
- Read the relevant maintained references before architectural changes; label source findings, runtime evidence and proposals accurately. Use targeted validation for behavior changes; documentation/comment edits do not require unrelated builds or services.
- Keep instructions concise here and link maintained documentation. Before editing nested areas, read any applicable nested AGENTS.md. Do not apply sibling repository instructions globally.

Suite references: [widgets.md](../../docs/widgets.md), [styles.md](../../docs/styles.md). Read [README.md](README.md) when present. These links use the beyond-suite checkout layout; if opened independently, inspect local source and do not invent missing suite documentation.
