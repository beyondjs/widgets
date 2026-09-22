import { routing, type IRoutingSettings } from '@beyond-js/kernel/routing';
import { manager } from '@beyond-js/widgets/routing';
import '@beyond-js/widgets/layout';

declare const process: any;

/**
 * What an application declares when it starts
 */
export interface IApplicationSettings {
	/**
	 * The element name of the main layout, a widget declared `is: "layout"`. Without it the application
	 * is a `beyond-layout-children` element whose children are the pages of the top level.
	 */
	layout?: string;

	/**
	 * The routing mode: `pathname` by default, `hash` when the document address must not change its
	 * path, such as a preview served under a path of its own
	 */
	routing?: IRoutingSettings;

	/**
	 * Where the main element is appended; the body of the document by default
	 */
	container?: Element;
}

/**
 * The startup of an application of pages and layouts on the development runtime.
 *
 * On the Engine an application configured itself from generated `config` and `start` modules and the
 * `__app_package` global. Here the entry module of the application imports its layout and page modules,
 * which registers their widgets, and calls `application.start` with what those modules described: the
 * routing is configured, the manager starts resolving the URI against the registered pages, and the main
 * element is placed in the document. Starting twice does nothing; the first settings win.
 */
export class Application {
	#element: Element;
	get element() {
		return this.#element;
	}

	get started(): boolean {
		return !!this.#element;
	}

	start(settings: IApplicationSettings = {}): Element {
		if (this.#element) return this.#element;
		if (typeof process === 'object') throw new Error('An application of pages starts in a browser: server rendering of pages is not implemented');

		routing.setup(settings.routing);
		manager.setup({ layout: settings.layout });

		this.#element = document.createElement(settings.layout ?? 'beyond-layout-children');
		(settings.container ?? document.body).append(this.#element);
		return this.#element;
	}
}

export /*bundle*/ const application = new Application();
