import type { URI } from '@beyond-js/kernel/routing';
import { Events } from '@beyond-js/events/events';
import { Route } from './route';

/**
 * The PageURI class is designed to extend the URI structure provided by the BeyondJS kernel routing,
 * incorporating variables extracted from the pathname as defined by a Route object.
 *
 * Additionally, it is expected for the URI to change in response to modifications in the query string.
 * This class facilitates the tracking of these changes, ensuring that the page can respond dynamically
 * to query string updates.
 */
export /*bundle*/
class PageURI extends Events {
	readonly #route: Route;
	get route() {
		return this.#route;
	}

	#uri: URI;
	get uri() {
		return this.#uri;
	}

	get pathname() {
		return this.#uri.pathname;
	}

	get search() {
		return this.#uri.search;
	}

	get qs() {
		return this.#uri.qs;
	}

	get hash() {
		return this.#uri.hash;
	}

	get vars() {
		return this.#route.vars;
	}

	constructor({ uri, route }: { uri?: URI; route?: Route }) {
		super(); // Call the super constructor

		this.#route = route;
		this.#uri = uri;
	}

	update(uri: URI) {
		if (this.#uri === uri) return;

		this.#uri = uri;

		// Dispatch the "change" event when the URI is updated
		const { qs } = this;
		this.trigger('change', { qs });
	}
}
