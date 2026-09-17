# Widgets architecture and public modules

Widgets connects a custom element to an independently loaded Beyond controller module. Controllers and framework adapters render inside an open shadow root; routing composes page and layout widgets. A widget's DOM name, versioned public module and internal source files have different identities. Registration can precede loading the controller, and loading a public module does not by itself mount a widget.

This package supplies client orchestration and server controller contracts. It does not compile widget bundles, implement an HTTP SSR server or supply a framework renderer. Those services consume the contracts described here.

## Public module map

The [package manifest](../src/package.json) names `@beyond-js/widgets`. Each row is a public Beyond module, not a filesystem import path.

| Public module | Platforms | Public surface and responsibility |
| --- | --- | --- |
| [render, browser](../src/modules/render/web/module.json) | web, android, ios | `widgets`, `attributes`, `BeyondWidget`, `IWidgetSpecs`, `WidgetCSR`, `IBeyondWidgetController`, `NodeWidget`, `StylesManager`, `GlobalCSS`, `prerender`: metadata registration, custom elements, instances, loading and resources. |
| [render, server](../src/modules/render/ssr/module.json) | ssr | `widgets`, `IWidgetSpecs`, type aliases `StylesManager` and `BeyondWidget`: metadata registry without browser construction. The aliases are not executable browser implementations. |
| [controller](../src/modules/controller/module.json) | web, android, ios, ssr | `WidgetControllerBase`, `WidgetClientController`, `WidgetServerController`, `WidgetAttributes`, `IWidgetStore`, `IWidgetRendered`, `IPageWidgetController`. |
| [routing](../src/modules/routing/module.json) | web, android, ios, ssr | `Route`, `PageURI`, `PageInstance`, `LayoutInstance`, `manager`. The manager singleton is undefined when `typeof process === 'object'`. |
| [layout](../src/modules/layout/module.json) | web, android, ios | `ssr` hierarchy handoff; module evaluation defines `beyond-layout-children`. |
| [application](../src/modules/application/module.json) | web, android, ios | Startup side effect; no marked public declaration. Loads configuration/startup and appends the application layout. |

The two render directories implement the same public identity for different platforms. Import `@beyond-js/widgets/render`; do not replace it with a source-directory path. Browser-only helpers remain internal except for the explicitly marked declarations listed above. The renderer's internal `IWidgetRendered` additionally requires `element`; the public controller interface does not. Producers must supply the browser prerender lookup's required element identity.

## Registration, names and execution environments

[widgets.register](../src/modules/render/web/widgets.ts) takes an array of specifications. Each specification identifies `name` (custom-element tag), `vspecifier` (versioned public module), optional `attrs`, `is`, `route`, `layout`, and `render` (`csr`, `ssr`, `sr`, optional `multilanguage`). Runtime registration defaults a missing render object to CSR only and defaults a nonboolean csr to true. It mutates the supplied specification. Existing tag names are ignored, so re-registration does not update metadata or observed attributes.

Browser registration stores metadata and defines an element subclass whose observed attributes come from `attrs`. It does not import every controller. Element construction starts the CSR import when enabled. This is demand loading by element construction/upgrade, including detached elements, not viewport visibility. The version is stripped from `vspecifier` to form the `bimport` request; the runtime resolver must select the correct dependency version. Controller HMR and dependency styles still use the original `vspecifier`.

`widgets` inherits mutable Map operations, but calling Map.set directly does not perform custom-element registration. Registration checks `typeof process === 'object'` before defining elements; this is a heuristic, so a browser process shim can suppress registration. Browser render also defines `beyond-link` at evaluation, while layout defines its custom element without that guard. Correct platform selection is required; these are not universal Node entry points. Duplicate custom-element definition errors are not caught.

`widgets.setup({ssr})` stores a global ssr flag, default true. WidgetSSR does not consult it: each widget's `specs.render.ssr` controls that path. Setting this global flag alone does not disable SSR fetches.

## From an element to a controller

[client rendering and styles](rendering.md) specifies all render modes and their resource contracts. The ordinary CSR sequence is:

1. Construction creates an open shadow root, global-attribute helper, SR/SSR/CSR helpers and StylesManager. CSR starts `bimport(widget.specifier)` immediately.
2. Connection registers the instance, appends a hidden span holder, applies global attributes and starts SSR, SR and CSR initialization. These paths run concurrently.
3. CSR waits for both connection initialization and module import. It requires a callable public `Controller` export, constructs `new Controller(widget)` and awaits its `initialise()` promise.
4. Successful initialization emits the helper's `controller.initialised` event. BeyondWidget forwards a nonbubbling, noncomposed DOM event with the same name for page/layout consumers.
5. Disconnection calls the controller's optional disconnect method. It does not cancel import, remove the holder or unregister the instance.

WidgetCSR exposes `bundle`, `controller`, `error`, `loaded`, `loading`, initialise, disconnect and attributeChanged. `loaded` means import completion, not successful controller initialization. The loading flag never becomes true. Import and missing-export failures record an error; initialization failures are logged without filling that error field. Constructor failures reached from import completion enter the import catch; synchronous construction failures reached from initialise can escape. There is no general retry/fallback protocol.

## Controller and store contracts

[WidgetControllerBase](../src/modules/controller/controller.ts) resolves metadata by element name unless specs are passed directly. It exposes specs, element, is, route, layout and unversioned package name `pkg`. Adapters override `Widget` and optionally `createStore(language?)`; the defaults return undefined. `IWidgetStore` declares optional `isStore`, `toJSON`, `hydrate` and `fetch`, but the core does not implement a store, persistence, subscriptions or state reconciliation.

[WidgetClientController](../src/modules/controller/client.ts) holds widget, store, attributes and the widget's StylesManager. Construction creates Kernel DependenciesStyles for the controller's versioned module and forwards URL changes to that manager. Initialization creates the store, reads `widget.ssr.prerender`, hydrates when that object is already present, invokes fetch without awaiting it, renders, then subscribes to the matching Kernel bundle package's HMR change event.

Consequences of this ordering:

- CSR does not wait for SSR/SR completion. Store hydration is timing-dependent, and SR's prerender is not read by this controller.
- When a store exists and prerender data exists, `store?.hydrate(cached)` still requires hydrate to be callable despite the optional interface method. A missing method can reject initialization. A rejected hydration prevents fetch/render/HMR setup.
- Fetch is optional and unawaited. Synchronous throws reject initialization; rejected returned promises have no local handler. A store and adapter must publish fetched state through their own mechanism.
- render catches synchronous mount errors and logs them. It does not await asynchronous mount work. An initialized event therefore is not proof of visible content or loaded styles.
- A missing Kernel bundle logs an error after render. HMR setup is skipped, without undoing the mount.

Adapters implement mount/unmount. Base refresh calls unmount then render; disconnect only unmounts. Neither guarantees framework state preservation. Controller HMR changes refresh the existing controller instance, rather than constructing a new controller class or store. Kernel's internal replacement and adapter bindings determine which implementations become visible. No direct inspector transport is implemented here.

[WidgetServerController](../src/modules/controller/ssr.ts) collects dependency-style URLs and prepends `##_!<package>!_##global.css`. Its abstract render receives props and returns an object or promise containing optional html/css/errors/warnings/store/attributes. Concrete server adapters own framework markup generation from the supplied props and styles. The server orchestrator owns creating/fetching stores and serializing the response; JSON serialization can invoke a store’s toJSON method. A server that needs `element` must add it. The core provides neither HTTP request handling nor automatic nested rendering.

## Attributes and instance hierarchy

[WidgetAttributes](../src/modules/controller/attributes.ts) is a Map initialized from declared attrs and current DOM values. change sets the value, emits `change` with no arguments and `<name>:change` with the new value. Values are strings or null at runtime; old is ignored. Direct Map mutations do not emit these events. Attribute changes before controller construction are not queued, but its constructor reads the current values. Changes after construction are forwarded even before initialization finishes.

The separate [global attributes registry](../src/modules/render/web/attributes.ts), exposed through `attributes` and `widgets.attributes`, adds/removes attributes on every connected widget's **holder**, not its custom-element host. add emits add(name,value) and change; remove emits remove(name) and change. Its mutable values Map can bypass notification. [WidgetGlobalAttributes](../src/modules/render/web/widget/attributes.ts) has destroy logic, but BeyondWidget never invokes it.

[instances](../src/modules/render/web/instances/index.ts) is a Set exposed by widgets.instances. Registration finds the nearest registered host across shadow-root boundaries, creates a NodeWidget and inserts the child into its parent's child Set. This is a shadow-host hierarchy, not every light-DOM ancestor. BeyondWidget exposes wnode, wparent and a copied wchildren array after connection. No unregister path removes disconnected nodes or old parent edges.

## Resource lifetime and extension limits

Reconnection is not a supported clean restart in this implementation: it registers another node, appends another holder, repeats global subscriptions and calls already initialized helpers. CSR rejects repeated initialization when enabled; SR rejects it even when SR was disabled on the first connection. A pending import can still create and mount a controller after detach. There is no cancellation guard based on connection state.

Client controllers do not remove their HMR callbacks or DependenciesStyles listeners, nor dispose stores. Widget disconnection does not call StylesManager.destroy or global-attribute destroy. Routing retains page/layout objects and DOM elements for the session without eviction. Preserve these ownership distinctions when extending lifecycle behavior; do not treat unmount as complete disposal.

## Build and validation

[beyond.json](../beyond.json) includes source and fixture package manifests. Source version 1.1.4 declares Kernel ~0.1.13 and Events ~0.0.7, web at 9121 and ssr at 9122, both using tsc. Module tsconfig files target ES2017/ES2020 modules with noImplicitAny. There is no root npm manifest with a standalone start/test command. A compatible Beyond compiler must understand platform-selected modules and widget bundles; runtime bare-module resolution, generated application config/start and dependency artifacts must be provided separately.

The [fixture package](../tests/package.json) includes HTML-controller variants, two pages and two layouts, with web/web-ts/ssr ports 8080/8081/8082. It uses the older libraries.imports integration field and Kernel ~0.1.11. It is illustrative source, not an assertion-based runner. The CSR abstract HTML controller declares addListeners/removeListeners while several concrete fixtures omit them; strict compilation needs verification. Its direct innerHTML mounting does not exercise a framework hydration protocol or the complete stylesheet handshake. Fixture availability does not establish current browser, SSR or HMR acceptance.

Validation should separately cover construction versus connection, delayed/failed imports, missing Controller, attributes before initialization, store hydration/fetch failures, SSR/SR races, CSS load/error/replacement, disconnect/reconnect and listener ownership. For routing, cover precedence, query-only navigation, nested layouts, missing routes and cyclic metadata. Test each framework adapter against the same observable contract. The required lifecycle and serialization decisions should be made explicitly before implementing a replacement runtime; keep the existing registration → widget → controller → adapter and route → page → layout structure recognizable.
