# Pages, layouts and application startup

Routing connects the current URI of the runtime's routing family to registered page metadata, then activates a hierarchy of reusable layout/page instances. It is optional for embedded ordinary widgets. Since 2026-09-22 it runs on the development runtime, whose `routing` family (`@beyond-js/local-2026/routing`, the API of the Kernel's v1 routing) the compiler maps the `@beyond-js/kernel/routing` imports to; an application starts it explicitly with `application.start()`, in place of the generated config/start modules of the Engine.

## Route matching

[Route](../src/modules/routing/pages/route.ts) stores pathname, page and vars. process scans widgets whose is equals page, splits each route and pathname on slashes, and compares only equal-length arrays. A whole segment such as `${id}` captures the corresponding raw pathname segment. The first matching registration wins; there is no static-route priority, decoding, optional parameter, wildcard or normalization phase. Missing route metadata can throw at split. When nothing matches, it awaits Kernel routing.missing(pathname) and uses the returned page element name.

vars is cleared for each attempted candidate but can contain partial captures from the final failed candidate when falling back. Callers should not treat fallback variables as a validated route match. The missing-route callback does not automatically register a widget.

[PageInstance](../src/modules/routing/pages/instance.ts) contains a PageURI and a session counter id `<element>:<number>`. Its parents getter walks widget.layout links and returns ancestor specs from outermost to innermost. Missing layout returns an error; a missing page specification throws. There is no cycle detection or enforcement that each referenced spec is actually a layout. Cyclic metadata can loop indefinitely.

## Page reuse and URI events

The [page collection](../src/modules/routing/pages/index.ts) is keyed by pathname. Repeated visits with another query/hash reuse the PageInstance and update its PageURI, retaining its original Route object. New pathnames create new instances even if the same parameterized page module matches. There is no eviction. obtain({id}) resolves an id; obtain({widget}) reads data-child-id. The older instance(id) method remains available but is deprecated in source.

[PageURI](../src/modules/routing/pages/uri.ts) delegates pathname, search, qs and hash to Kernel's URI and vars to its saved Route. update only checks URI object identity; a new object emits change with `{qs}` even if query contents match, whereas mutation of the same object emits nothing. Adapter page controllers subscribe when they need query updates; core does not invoke IPageWidgetController.onQueryStringChange itself. PageURI extends the `Events` of `@beyond-js/kernel/core`, like the other core helpers, which the compiler maps to the runtime's `core` family; the earlier dependency on `@beyond-js/events` is gone.

## Manager and layouts

The [manager](../src/modules/routing/manager.ts) singleton is created only outside a process-object environment. It does nothing until `setup({ layout? })` is called, once: the call creates the main LayoutInstance from the given layout element name (`main` without one) and attaches to the routing's `change` event and readiness. `application.start()` calls it; there is no destroy API. Before `setup`, `manager.ready` stays pending and `beyond-layout-children` elements wait on it.

set(uri) resets a cancellation token, resolves a Route, and checks the token before registering the page. A missing page or missing ancestor logs and marks manager initialized; therefore ready does not prove a page was rendered. Other thrown errors can leave first readiness pending. An ancestor matching the main layout is removed from the path, then main.activate receives the page and remaining layouts. set does not wait for controller import, mounting or stylesheet readiness.

[LayoutInstance](../src/modules/routing/layouts/layout.ts) owns children, active, element/id and change events. It reuses a matching immediate child layout, adds pages/layouts by id, recursively activates the next level and deactivates a previous active layout. Page and layout elements remain cached. Layout ids are just element names; the global layout registry can overwrite an instance when the same layout tag appears under different parent branches. There is no global parent-qualified identity. activate mutates its supplied layouts array with shift. Default main layout identity is `main`, not a DOM tag for creation.

## beyond-layout-children

Loading [layout](../src/modules/layout/children.ts) defines this custom element; the routing module is imported statically. Connection attaches an open shadow root, optionally displays the SSR hierarchy while the manager resolves its first URI, then selects the containing layout by nearest registered shadow host or document root. A configured main layout uses manager.main; nested lookup uses the layout element name in manager.layouts.

Rendering creates child widget elements as needed, tags them with data-child-id and keeps all cached children attached. It hides inactive elements using hidden, invokes controller.hide when hiding, and invokes show when becoming active. If the controller is not ready, a controller.initialised listener waits and checks that the element is still active. Hiding a page does not disconnect/unmount it: a hidden page keeps its framework state, and the page shows it again when the history returns to it. The element removes its layout listener on disconnection and reuses its shadow root on reconnection.

The SSR handoff hydrates at most one existing child by assigning the first managed child key. Multiple initial children are logged as unexpected. It does not compare a full tree or recover inconsistent SSR identities. There is no disconnectedCallback to remove layout/SSR listeners, and reconnect attempts attachShadow again. Element teardown and safe reconnection require explicit work.

The public [ssr](../src/modules/layout/ssr.ts) EventTarget stores main, page, layouts and hierarchy. data(main,page) appends hierarchy entries and emits received; repeated calls do not reset the previous hierarchy. It is a startup handoff, not a replaceable routing store.

## Application bootstrap

[application](../src/modules/application/index.ts) exports `application`, whose `start({ layout?, routing?, container? })` configures the routing (`routing.setup`, mode `pathname` unless `hash` is asked; `hash` keeps the path of the document, which a preview served under a path needs), starts the manager with the main layout element name, appends that element (`beyond-layout-children` without a layout) to the container (`document.body` by default) and returns it. The entry module of the application imports its layout and page modules first, so that their widgets are registered, sets `routing.missing` or `routing.redirect` if it needs them, and calls `start` once; a second call returns the same element. On Node `start` throws: server rendering of pages (the `__ssr_fetch` handoff of the Engine and the `@beyond-js/ssr` service) is not implemented on the development runtime, and the `ssr` object of `layout` keeps its interface for a future producer. Starting does not ensure route, controller or styles completion: `manager.ready` resolves after the first URI is resolved, whether or not a page was found.

[beyond-link](../src/modules/render/web/anchor.ts) is another registration side effect of browser render. Clicking pushes its data-url through the routing, imported statically; the listener is removed on disconnection. It is not a native anchor: no default navigation prevention, keyboard/link semantics or target handling is implemented. Applications needing normal link accessibility and browser navigation behavior must implement those deliberately.

The pages scenario of the suite testbed (`widget-pages`) and the `pages` case of the command line's web acceptance execute this on the development runtime: a main layout with navigation, pages with a route variable and a query string, a nested layout, the history back through pages that kept their state, a page for unknown addresses, and a page edit applied without a navigation. Open limits: the pathname mode has no base path; a page loaded on demand through `bimport` is not part of the graph of a preview; route precedence, cyclic layout metadata and the SSR hierarchy remain as described above.
