/**
 * The browser implementation of `@beyond-js/widgets/render`: registration of widgets as custom elements,
 * the instances tree, loading and the resources of a widget. What this file exports is the public API of
 * the module; the other files of the directory stay internal.
 */
export { widgets } from './widgets';
export { attributes, Attributes } from './attributes';
export { BeyondWidget } from './widget';
export type { IWidgetSpecs } from './widget';
export { WidgetCSR } from './widget/csr';
export type { IBeyondWidgetController } from './widget/csr';
export { NodeWidget } from './instances/node';
export { StylesManager } from './widget/styles';
export { GlobalCSS } from './widget/styles/global';
export { prerender } from './prerendered';
