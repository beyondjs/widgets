/**
 * Uri parser
 *
 * @param href {string} The href to be parsed
 * @constructor
 */
import {QueryString} from "./querystring";

export /*bundle*/
class URI {
    readonly #uri: string;
    get uri(): string {
        return this.#uri;
    }

    readonly #pathname: string;
    get pathname(): string {
        return this.#pathname;
    }

    readonly #search: string;
    get search(): string {
        return this.#search;
    }

    readonly #qs: QueryString;
    get qs() {
        return this.#qs;
    }

    readonly #hash;
    get hash() {
        return this.#hash;
    }

    constructor(uri: string) {
        this.#uri = uri;

        const [u, hash] = uri.split('#');
        const [pathname, search] = u.split('?');

        this.#pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
        this.#search = search ? search : '';
        this.#qs = new QueryString(this.#search);
        this.#hash = hash;
    }
}
