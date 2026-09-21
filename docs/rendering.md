# Rendering, styles and HMR

A widget can enable client-side rendering (CSR), server-side rendering (SSR), static rendering (SR), or a combination. These flags select concurrent helpers, not an ordered pipeline with guaranteed hydration. The [architecture guide](architecture.md) defines registration and controller APIs; this guide specifies the data and timing involved in rendering.

## CSR

[WidgetCSR](../src/modules/render/web/widget/csr.ts) starts the controller import during widget construction and mounts after connection. The adapter owns framework mounting, hydrating an existing holder, revealing it and removing framework resources. The core controller's render method alone does not set holder visibility or wait for CSS. A custom adapter must complete the stylesheet handshake or choose a deliberate rendering policy.

A minimal metadata shape is:

```ts
import { widgets } from '@beyond-js/widgets/render';

widgets.register([{
    name: 'example-card',
    vspecifier: '@example/app@1.0.0/card',
    attrs: ['title'],
    render: { csr: true, ssr: false, sr: false }
}]);
```

This requires an actual compiled public module exporting Controller, matching runtime dependency resolution and a functioning adapter. Creating `<example-card>` starts its import. The tag name does not select React, Vue or Svelte; the imported controller selects its adapter.

## SSR data and fetching

[prerender](../src/modules/render/web/prerendered/index.ts) exposes a mutable `ssr` array and find(element, attrs). Entries are browser-renderer objects containing `element`, html and optional store/attributes/errors/warnings/css. Attribute tuples are intended to distinguish instances of the same element. Currently the attribute comparison reduces with OR from true, so it always succeeds once the element name matches. The first same-element entry is returned regardless of attribute values and is not consumed. Multiple instances can therefore reuse the wrong markup/store.

[WidgetSSR](../src/modules/render/web/widget/ssr.ts) checks render.ssr, initializes once, builds an attribute Map and searches prerender. A match sets ssr.prerender and calls Renderer. Otherwise it imports `<package>/config`, reads default.ssr.host and requests `/widget?name=<element>` from that host. Missing host logs and returns. Optional language comes from localStorage.__beyond_language or navigator.language, truncated to two characters.

The attribute URL builder has an implementation defect: its nonempty-attrs branch constructs a string but does not return it. The URL then contains a literal `undefined` suffix rather than the intended attrs parameters. Even after returning that string, direct interpolation would require proper encoding of names/values. No request cancellation, retry, credentials option or attribute-change refetch is provided. Status other than 200 and fetch/JSON failures log and return. Import/config failures propagate to the connection handler's catch. Successful JSON is retained as prerender before rendering, including responses whose errors later prevent markup insertion.

The HTTP endpoint and its JSON producer are external responsibilities. The SSR render platform in this repository only registers metadata and supports controller contracts; it is not that endpoint.

## Static rendering

[WidgetSR](../src/modules/render/web/widget/sr.ts) requests `location.origin/__sr_widgets__/<name>.<checksum>.js`, but parses the response as JSON. The host getter always uses current location origin; it does not consult the widget package's SSR host.

The checksum input includes a language prefix when multilanguage is enabled. For pages it includes name, current location.pathname and search; for layouts it includes name; for ordinary widgets it concatenates truthy declared attributes. The attribute comparator returns 1 or 0 rather than a full ordering relation, so do not assume a canonical permutation-independent key. Empty/falsy attribute values are omitted. The internal [checksum](../src/modules/render/web/widget/checksum.ts) hashes UTF-16 code units with a signed 32-bit multiply-by-31 recurrence and replaces a minus sign with n. It is not the separate CRC32 utility, and it is not collision-free. Empty input returns numeric zero; other outputs are strings.

A static producer must reproduce this exact naming/encoding protocol or change both sides deliberately. WidgetSR stores its result under sr.prerender and invokes Renderer. The client controller only hydrates from ssr.prerender, so SR markup does not automatically hydrate its store. There is no attribute-change refetch or network cancellation. Even a disabled SR helper marks itself initialized before returning, affecting reconnection.

## Markup insertion and concurrent modes

[Renderer](../src/modules/render/web/widget/renderer.ts) logs response errors and returns. It skips insertion when holder.children already has elements and ignores falsy html. Otherwise it replaces every `##_!<package>!_##` marker with `<host>/styles/` of the widget, regardless of the package name in the marker, and writes innerHTML. It consumes HTML link elements rather than the response css field. The input is treated as trusted generated markup; no sanitization or multi-origin package resolver is implemented here.

It gathers link.href values, initializes StylesManager when any links exist, attaches load and error handlers and waits for styles.ready before revealing the holder. A link that fails is reported to the manager as an error, which keeps the previous version of that resource. Initializing an already initialized StylesManager throws. Already loaded/cached resources and listener timing require explicit validation.

The element runs the SSR and SR paths to completion before it constructs the client controller, so the children guard of the renderer decides between the two server paths only, and the framework hydrates what they inserted. The web acceptance registers server output rendered on Node in `prerender.ssr` and asserts that the node written by the server is the one that stays after hydration. Each SSR/SR helper owns a separate Renderer with its own cancellation counter, which suppresses the final reveal for a later call to the same renderer; it does not undo inserted HTML or abort fetches. Errors/warnings are not a rendered fallback UI.

## StylesManager contract

[StylesManager](../src/modules/render/web/widget/styles/index.ts) tracks href → loaded booleans and exposes resources, initialised, version, loaded, ready, on/off, initialise, update, onloaded, onerror and destroy. It does not create link elements. Adapters or Renderer create them and report completion. `onloaded` and `onerror` accept **either a DOM Event or an href string**; passing a stylesheet load event is supported.

- initialise can run once. It prepends the shared `global` stylesheet of the package when the registration of the widget declares one, copies the supplied URL array and registers resources as not loaded.
- ready is a single promise. loaded/ready check whether all current entries are loaded. An early check on an empty map resolves it permanently before initialization. After first resolution, new HMR resources do not make loaded false or create a new promise.
- update adds unseen URLs and increments version when something is added. A change event is emitted only after the manager has resolved once. Removed dependencies are not removed merely because a subsequent update omits their URLs.
- onloaded checks the exact href, marks it loaded and purges older loaded versions. Unknown href logs a warning. onerror forgets the failed version, so the last loaded one stays adopted.
- [Link](../src/modules/render/web/widget/styles/link.ts) tells the versions of one resource apart by the `#v=<n>` fragment the development runtime appends, and by the legacy `?version=<n>`; a replacement addressed under `/u/<hash>/` is normalized to the resource it replaces. Other query-string orderings and revision keys are not normalized.
- Purging retains the newest loaded version and newer loading versions. It removes older map entries, leaving actual DOM reconciliation to the adapter.
- destroy only removes its GlobalCSS change callback. It does not remove links, clear own consumers or reject a pending ready promise; the client controller's `dispose` releases the runtime's DependenciesStyles.

[GlobalCSS](../src/modules/render/web/widget/styles/global.ts) constructs its URL once as `<host>/styles/global<query>` of the package of the widget. update increments a counter and emits change, but never recomputes the readonly URL. The compiler declares in the registration of a widget whether its package publishes a `./global` module, so a package without one links nothing.

## Module updates and ownership

The client controller listens to the change event of the runtime bundle package of its module and calls refresh on the existing controller; the development runtime triggers that event after it applies an update, whether the module itself or one it imports changed, so the widget re-renders through its original import. DependenciesStyles changes update stylesheet URLs independently: the runtime replaces a registered stylesheet when a build announces a new hash, and the collector forwards the change to the manager. Notification delivery, artifact fetching and internal-module replacement belong to the runtime and the development service. The command line's web acceptance observes both paths in a browser: a code edit of an imported module reaching a mounted widget with its counter kept, and a CSS edit changing a computed style inside the root without a navigation.

HMR acceptance must establish the correct versioned bundle identity, updated public exports, adapter refresh, store/component state policy, stylesheet replacement and final disposal. Core does not promise reverse-dependency reevaluation, arbitrary state migration, controller-class reconstruction or failure rollback. Preserve the distinction between refreshing a mounted view and replacing executable internal modules.
