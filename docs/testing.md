# Testing

This repository has no assertion suite and no test runner. Its behavior is exercised from other repositories: the command line's `web` acceptance in the `cli` repository mounts React 19, Vue, Svelte and plain HTML widgets in a real browser against an installed service, with stylesheet adoption and replacement, code updates through the original import, moving an element between roots, a late import, pages and layouts, and server rendering followed by hydration; the Packages repository compiles and serves this package to every workspace (both optional external references). [Build and validation](architecture.md#build-and-validation) states which cases that acceptance covers and which remain to be written. `tests/` is an illustrative package in the Engine format, not a test suite.

## Levels and commands

| Level | Location | Command | What it establishes |
| --- | --- | --- | --- |
| Contract/unit and integration | None in this repository | None | Nothing |
| Browser acceptance | `cli` repository, the `web` acceptance | Its README | The cases [build and validation](architecture.md#build-and-validation) lists as covered, against the installed Widgets package |
| Illustrative package | `tests/` ([its README](../tests/README.md)) | None: no validation runs it | Nothing |

## Fixtures

| Group | Files | Used by | Notes |
| --- | --- | --- | --- |
| `tests/` (`@beyond-js/widgets-tests`) | `package.json`, six modules under `tests/modules/` (`html-controller/csr`, `html-controller/ssr`, `layouts/layout-1`, `layouts/layout-2`, `pages/page-1`, `pages/page-2`) and checked-in declarations under `tests/modules/node_modules/` | Nothing automated; [beyond.json](../beyond.json) selects it next to the source package | Engine authoring format, `libraries.imports`, Kernel ~0.1.11 |

## Exceptions and limits

- `tests/` keeps its name although it holds no tests: it is an illustrative Engine-format package, kept unmodified, and [its README](../tests/README.md) says so.
- Because [beyond.json](../beyond.json) lists `tests/package.json`, a workspace that reads this repository's manifest discovers and compiles the illustrative package beside the source package; it is not excluded from discovery.
- The illustrative package does not establish current browser, SSR or HMR behavior; see [build and validation](architecture.md#build-and-validation) for its known gaps.

## Test organization and source fixtures

These rules are shared by every Beyond repository.

- Contract/unit and integration tests live in `test/` or `tests/`; complete journeys against an installed, composed or exported product live in `acceptance/`, with a README of their own. Harness infrastructure (servers, registries, process lifecycle, copying and substitution) lives in a `support/` directory of the consuming area.
- Applications, packages, modules, documents and assets a test exercises are checked-in files with their real extensions and directory structure under the consuming area's `fixtures/`. Each fixture group has a README naming its purpose, entry modules, the tests that use it, their command, the expected behavior and any intentionally invalid part. A reader inspects the example without running or decoding a generator.
- A harness copies the fixtures it runs or edits to a unique temporary directory, substitutes only explicit values such as versions, ports or origins, and never writes the checked-in files, even when a run fails. Credentials, machine paths and build output are never fixture source.
- Small input values, expected values, protocol payloads and short edits stay inline. Source is generated only when generation is the behavior under test (size or memory stress, combinations, deliberately malformed input); the guide states why, the parameters that reproduce it and how to inspect what was generated.
- Fixtures stay out of the repository's production compilation, discovery and packaging.
- Migrating a test preserves its scenario identities, its positive, negative and recovery cases and its real execution path; an existing failure stays reported as a failure.
