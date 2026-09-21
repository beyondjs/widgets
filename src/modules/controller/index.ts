/**
 * The controller contracts of a widget: the base every controller shares, the client controller that a
 * framework adapter extends to mount a view, and the server controller that renders one. What this file
 * exports is the public API of `@beyond-js/widgets/controller`.
 */
export { WidgetControllerBase } from './controller';
export type { IPageWidgetController, IWidgetStore } from './controller';
export { WidgetClientController } from './client';
export { WidgetServerController } from './ssr';
export type { IWidgetRendered } from './ssr';
export { WidgetAttributes } from './attributes';
