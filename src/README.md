# Widgets source package

This directory contains the Beyond-authored `@beyond-js/widgets` package. Its [manifest](package.json) selects modules by public name and target platform; browser and SSR implementations of render have the same public module identity.

Read the [architecture and API guide](../docs/architecture.md), [rendering and HMR contracts](../docs/rendering.md), and [routing and startup guide](../docs/routing.md). These define the component's responsibilities and limitations, including the external compiler, resolver, framework and server contracts required for integration.
