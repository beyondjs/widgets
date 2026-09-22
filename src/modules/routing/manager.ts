import { CancellationToken } from '@beyond-js/kernel/core';
import { routing, URI } from '@beyond-js/kernel/routing';
import { LayoutInstance } from './layouts/layout';
import { PageInstance } from './pages/instance';
import Pages from './pages';
import Layouts from './layouts';
import { Route } from './pages/route';

declare const process: any;

/**
 * What an application tells the manager when it starts
 */
export interface IManagerSettings {
	/**
	 * The element name of the main layout of the application. Without it, the main layout is the
	 * `beyond-layout-children` element the application places in the document.
	 */
	layout?: string;
}

/**
 * Connects the current URI of the runtime's routing to the registered pages and layouts, and activates
 * the hierarchy of layout and page instances the URI selects.
 *
 * The manager does nothing until the application calls `setup`: on the Engine it configured itself from
 * the generated `config` and `start` modules of the application and the `__app_package` global, which the
 * development runtime does not have. `ready` resolves after the first URI was resolved, whether or not a
 * page was found for it.
 */
class Manager {
	// The registry of all layouts (except the main layout) and pages instances registered in the session
	readonly #instances = { layouts: new Layouts(), pages: new Pages() };

	#initialised = false;
	get initialised() {
		return this.#initialised;
	}

	#resolve: any;
	#ready = new Promise(resolve => (this.#resolve = resolve));
	get ready() {
		return this.#ready;
	}

	#configured = false;
	get configured() {
		return this.#configured;
	}

	get layouts() {
		return this.#instances.layouts;
	}

	get pages() {
		return this.#instances.pages;
	}

	// The main layout: the element the application names, or the `beyond-layout-children` in the document
	#main: LayoutInstance;
	get main() {
		return this.#main;
	}

	/**
	 * Starts routing the pages: once, the first call wins
	 */
	setup(settings: IManagerSettings = {}) {
		if (this.#configured) return;
		this.#configured = true;
		this.#main = new LayoutInstance(this.#instances.layouts, settings.layout);

		const set = () => this.set(routing.uri).catch(exc => console.error(exc.stack));
		routing.on('change', set);
		routing.initialised ? set() : routing.ready.then(set);
	}

	#ct = new CancellationToken();

	async set(uri: URI) {
		const cid = this.#ct.reset();

		const route = new Route(uri.pathname);
		await route.process();
		if (!this.#ct.check(cid)) return;

		const done = () => {
			!this.#initialised && this.#resolve();
			this.#initialised = true;
		};

		const { page: element } = route;
		if (!element) {
			console.error(`Pathname "${uri.pathname}" does not have a page widget associated to it`);
			return done();
		}

		const page: PageInstance = this.#instances.pages.register(uri, route);

		// Property page.parents.value is an array that contains the list of layouts where the page is contained
		const { error, value: layouts } = page.parents;
		if (error) {
			console.error(`Page on "${uri.uri}" cannot be shown: ${error}`);
			return done();
		}

		// If the root layout specified in the page widget is the same as the application layout,
		// then remove from the list
		layouts.length && layouts[0].name === this.main.element && layouts.shift();

		this.#main.activate(page, layouts);
		return done();
	}
}

export /*bundle*/ const manager = typeof process === 'object' ? void 0 : new Manager();
