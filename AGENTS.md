# widgets/widgets agent instructions

Canonical instructions for this repository and its descendants. Tool-specific files must only reference AGENTS.md. This is an independent Git repository.

Shared Widgets registration, controllers and rendering. Preserve public module identities and framework-neutral lifecycle boundaries. Since 2026-09-21 the package is authored for Packages: one `module.json` beside each public module (`render` holds a single manifest with its `web` and `node` conditionals), the `ts` bundler on the development runtime, and the toolchain supplies the package to every workspace. Read [the architecture](docs/architecture.md) and [rendering](docs/rendering.md) before changing the lifecycle. The widget lifecycle, the styles manager and the adapters are executed by the command line's `web` acceptance in a browser against an installation; pages, layouts and routing are not usable on the development runtime.

- Use English for first-party docs, instructions, comments, docstrings and new explanatory text. Preserve intentional locale catalogs, public names/specifiers/paths, protocol keys and functional test values unless a compatibility change is explicitly authorized. Do not rewrite vendor, generated, lockfile or third-party content for language cleanup.
- Preserve current uncommitted work and repository history. Do not commit, push, reset, publish or deploy without explicit task authorization.
- Keep public Beyond module imports distinct from internal relative source imports. Do not silently replace the configured bootstrap, runtime or framework.
- Read the relevant maintained references before architectural changes; label source findings, runtime evidence and proposals accurately. Use targeted validation for behavior changes; documentation/comment edits do not require unrelated builds or services.
- Keep instructions concise here and link maintained documentation. Before editing nested areas, read any applicable nested AGENTS.md. Do not apply sibling repository instructions globally.
- Follow the [coding standards](docs/coding-standards.md); they are binding for new and modified code. Source files target 300 lines or fewer and must not exceed 400. Model each responsibility as a class that owns `#private` state and exposes simply named members, composed from collaborating objects. Avoid compound names in methods, properties, variables and parameters by giving the responsibility its own object: `client.register()`, not `registerClient()`. Compound names remain allowed in class definitions. Preserve public contracts, and do not rewrite untouched files only to comply.


Read the local [README](README.md) for purpose and component contracts. Maintain self-contained documentation: relative Markdown links must stay inside this Git root, external repositories are optional named references, and supported execution examples use explicitly configured paths. Keep lasting architecture and API explanations separate from historical review/session records.

Documentation follows [the local documentation standards](docs/AGENTS.md).
