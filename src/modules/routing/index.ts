/**
 * The routing of pages and layouts: what `@beyond-js/widgets/routing` exports. It is written against the
 * routing family of the Kernel, which the development runtime provides as `@beyond-js/local-2026/routing`,
 * and it starts when the application calls `manager.setup`, which `@beyond-js/widgets/application` does.
 */
export { Route } from './pages/route';
export { PageURI } from './pages/uri';
export { PageInstance } from './pages/instance';
export { LayoutInstance } from './layouts/layout';
export { manager, type IManagerSettings } from './manager';
