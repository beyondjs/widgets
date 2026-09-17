# Pages, layouts and application startup

Routing connects Kernel's current URI to registered page metadata, then activates a hierarchy of reusable layout/page instances. It is optional for embedded ordinary widgets. It requires generated application config/start modules, widget registrations and a compatible Kernel routing runtime.

## Route matching

[Route](../src/modules/routing/pages/route.ts) stores pathname, page and vars. process scans widgets whose is equals page, splits each route and pathname on slashes, and compares only equal-length arrays. A whole segment such as `${id}` captures the corresponding raw pathname segment. The first matching registration wins; there is no static-route priority, decoding, optional parameter, wildcard or normalization phase. Missing route metadata can throw at split. When nothing matches, it awaits Kernel routing.missing(pathname) and uses the returned page element name.

vars is cleared for each attempted candidate but can contain partial captures from the final failed candidate when falling back. Callers should not treat fallback variables as a validated route match. The missing-route callback does not automatically register a widget.

[PageInstance](../src/modules/routing/pages/instance.ts) contains a PageURI and a session counter id `<element>:<number>`. Its parents getter walks widget.layout links and returns ancestor specs from outermost to innermost. Missing layout returns an error; a missing page specification throws. There is no cycle detection or enforcement that each referenced spec is actually a layout. Cyclic metadata can loop indefinitely.

## Page reuse and URI events

The [page collection](../src/modules/routing/pages/index.ts) is keyed by pathname. Repeated visits with another query/hash reuse the PageInstance and update its PageURI, retaining its original Route object. New pathnames create new instances even if the same parameterized page module matches. There is no eviction. obtain({id}) resolves an id; obtain({widget}) reads data-child-id. The older instance(id) method remains available but is deprecated in source.

[PageURI](../src/modules/routing/pages/uri.ts) delegates pathname, search, qs and hash to Kernel's URI and vars to its saved Route. update only checks URI object identity; a new object emits change with `{qs}` even if query contents match, whereas mutation of the same object emits nothing. Adapter page controllers subscribe when they need query updates; core does not invoke IPageWidgetController.onQueryStringChange itself. PageURI uses `@beyond-js/events/events`, while most other core helpers use Kernel Events, so both declared dependency contracts matter.

## Manager and layouts

The [manager](../src/modules/routing/manager.ts) singleton is created only outside a process-object environment. Construction immediately requires globalThis.__app_package.specifier, imports application config and start, creates a main LayoutInstance from config.layout and attaches to Kernel routing changes/readiness. There is no explicit setup or destroy API. Import rejection has no local catch in that constructor path and leaves manager.ready pending.

set(uri) resets a cancellation token, resolves a Route, and checks the token before registering the page. A missing page or missing ancestor logs and marks manager initialized; therefore ready does not prove a page was rendered. Other thrown errors can leave first readiness pending. An ancestor matching the main layout is removed from the path, then main.activate receives the page and remaining layouts. set does not wait for controller import, mounting or stylesheet readiness.

[LayoutInstance](../src/modules/routing/layouts/layout.ts) owns children, active, element/id and change events. It reuses a matching immediate child layout, adds pages/layouts by id, recursively activates the next level and deactivates a previous active layout. Page and layout elements remain cached. Layout ids are just element names; the global layout registry can overwrite an instance when the same layout tag appears under different parent branches. There is no global parent-qualified identity. activate mutates its supplied layouts array with shift. Default main layout identity is `main`, not a DOM tag for creation.

## beyond-layout-children

Loading [layout](../src/modules/layout/children.ts) defines this custom element. Connection attaches an open shadow root, optionally displays the SSR hierarchy while loading routing, then selects the containing layout by nearest registered shadow host or document root. A configured main layout uses manager.main; nested lookup uses the layout element name in manager.layouts.

Rendering creates child widget elements as needed, tags them with data-child-id and keeps all cached children attached. It hides inactive elements using hidden, invokes controller.hide when hiding, and invokes show when becoming active. If the controller is not ready, a controller.initialised listener waits and checks that the element is still active. Hiding a page does not disconnect/unmount it.

The SSR handoff hydrates at most one existing child by assigning the first managed child key. Multiple initial children are logged as unexpected. It does not compare a full tree or recover inconsistent SSR identities. There is no disconnectedCallback to remove layout/SSR listeners, and reconnect attempts attachShadow again. Element teardown and safe reconnection require explicit work.

The public [ssr](../src/modules/layout/ssr.ts) EventTarget stores main, page, layouts and hierarchy. data(main,page) appends hierarchy entries and emits received; repeated calls do not reset the previous hierarchy. It is a startup handoff, not a replaceable routing store.

## Application bootstrap

[application startup](../src/modules/application/startup.ts) runs on module evaluation. Without __ssr_fetch it imports app config/start, Kernel core/routing and Widgets routing/layout, then appends config.layout or beyond-layout-children to document.body. It expects DOM readiness and registered metadata; no exported startup function, duplicate-root guard or shutdown is provided.

With window.__ssr_fetch it waits for the injected promise and expects an object containing json with main, page and widgets.specs/instances. Specs are reconstructed from entry pairs; instances populate prerender.ssr; layout.ssr.data receives the hierarchy. It then appends the application root. JSON errors are intended to fall back to normal startup, but the missing-json branch dereferences ssr.json.errors while logging and can throw. Rejection of __ssr_fetch itself has no catch. Successful bootstrap does not ensure route/controller/styles completion.

[beyond-link](../src/modules/render/web/anchor.ts) is another registration side effect of browser render. Each instance imports Kernel routing, and clicking pushes its data-url once routing is available. It is not a native anchor: no default navigation prevention, keyboard/link semantics or target handling is implemented. Reconnection adds another click listener, and failed routing imports have no local catch. Applications needing normal link accessibility and browser navigation behavior must implement those deliberately.
