# Illustrative package

`tests/` holds `@beyond-js/widgets-tests`, an illustrative package in the Engine's authoring format. It is not a test suite: it has no test files and no assertions, and no validation of this repository or of another runs it.

- [beyond.json](../beyond.json) selects it next to the [source package](../src/package.json), so a workspace that reads this repository's manifest discovers it.
- [package.json](package.json) declares the module directory `modules/`, the `web`, `web-ts` and `ssr` distributions (bundle ports 8080, 8081 and 8082), the older `libraries.imports` integration field for `@beyond-js/widgets` and Kernel ~0.1.11.
- Its six modules: `modules/html-controller/csr` and `modules/html-controller/ssr`, `ts` bundles of an HTML controller for the `web` and `ssr` platforms; `modules/layouts/layout-1` and `modules/layouts/layout-2`, widgets declared with `is` `layout`; and `modules/pages/page-1` and `modules/pages/page-2`, widgets declared with `is` `page` and a route. `modules/node_modules/` holds checked-in declarations those modules compile against.

The behavior of Widgets is exercised by the command line's `web` acceptance in the `cli` repository; [the testing guide](../docs/testing.md) describes what runs and where.
