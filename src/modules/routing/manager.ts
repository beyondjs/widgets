import { CancellationToken } from '@beyond-js/kernel/core';
import { routing, URI } from '@beyond-js/kernel/routing';
import { LayoutInstance } from './layouts/layout';
import { PageInstance } from './pages/instance';
import Pages from './pages';
import Layouts from './layouts';
import { Route } from './pages/route';

declare const bimport: (resource: string, version?: number) => Promise<any>;
declare const process: any;

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

	constructor() {
		const set = () => this.set(routing.uri).catch(exc => console.log(exc.stack));

		// @TODO: move to the setup method
		const { specifier } = (<any>globalThis).__app_package;
		Promise.all([bimport(`${specifier}/config`), bimport(`${specifier}/start`)]).then(([{ default: config }]) => {
			// The main layout can be specified in the package.json,
			// if it is not specified, then a beyond-layout-children will be
			// set as default
			this.#main = new LayoutInstance(this.#instances.layouts, config.layout);

			routing.on('change', set);
			routing.initialised ? set() : routing.ready.then(set);
		});
	}

	get layouts() {
		return this.#instances.layouts;
	}

	get pages() {
		return this.#instances.pages;
	}

	// The main layout can be a custom element specified in the package.json
	// Otherwise, if it is not specified, the beyond-layout-children
	// will be set as default
	#main: LayoutInstance;
	get main() {
		return this.#main;
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
