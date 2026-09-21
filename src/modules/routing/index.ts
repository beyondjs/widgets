/**
 * The routing of pages and layouts: what `@beyond-js/widgets/routing` exports. It is written against the
 * routing family of the Kernel, which the development runtime does not provide yet: it compiles, and it
 * is not part of the widgets that run on that runtime.
 */
export { Route } from './pages/route';
export { PageURI } from './pages/uri';
export { PageInstance } from './pages/instance';
export { LayoutInstance } from './layouts/layout';
export { manager } from './manager';
