import type {URI} from '@beyond-js/kernel/routing';
import type {BeyondWidget} from '@beyond-js/widgets/render';
import {Route} from './route';
import {manager} from './manager';

export /*bundle*/
class PageURI {
    readonly #uri: URI;
    readonly #route: Route;

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

    constructor({widget, uri, route}: { widget?: BeyondWidget, uri?: URI, route?: Route }) {
        if (widget) {
            const child = widget.getAttribute('data-child-id');
            const page = manager.pages.instance(child);
            if (!page) {
                throw new Error(`Element "${widget.localName}" is not a page, or page not found`);
            }

            ({uri, route} = page);
        }

        this.#uri = uri;
        this.#route = route;
    }
}
