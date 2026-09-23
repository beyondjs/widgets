# BeyondJS Widgets

Widgets connects custom elements to independently loaded Beyond modules. A controller and its framework adapter render inside the element's shadow root; pages and layouts compose those widgets into applications. The core supplies registration, client lifecycle, server controller contracts, routing and stylesheet coordination.

- [Architecture and public APIs](docs/architecture.md): module identities, controllers, stores, attributes, instance ownership, build and validation.
- [Rendering, styles and HMR](docs/rendering.md): CSR/SSR/SR sequences, resource protocols, hydration timing and current limits.
- [Pages, layouts and startup](docs/routing.md): route matching, retained page instances, nested layout composition and application handoff.
- [Coding standards](docs/coding-standards.md): binding file-length, object-oriented design and naming rules.
- [Testing](docs/testing.md): where the package is validated, and what the illustrative `tests/` package is.

Public modules include `@beyond-js/widgets/render`, `/controller`, `/routing`, `/layout` and `/application`. Browser and SSR render implementations share one public identity selected by platform. Framework adapters, the compiler, runtime module resolver and SSR HTTP service are separate dependencies; the core does not provide them automatically.

The source is authored in Beyond, in the model Packages compiles: a `module.json` declares each public module, with one entry per platform for `render`. [beyond.json](beyond.json) selects the [source package](src/package.json) and [illustrative fixtures](tests/package.json), which remain in the Engine's authoring format. There is no standalone root npm start/test command: the Packages development service compiles and serves the package, supplies it to every workspace from the Beyond toolchain, and the command line's web acceptance exercises it in a real browser with the React 19, Vue and Svelte adapters. The guides describe implemented behavior and known integration limits; supported rendering flags alone do not establish complete hydration, cleanup or HMR across every adapter.
