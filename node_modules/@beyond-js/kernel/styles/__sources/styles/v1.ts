import {Events} from '@beyond-js/kernel/core';
import {instances as bundles, Bundle} from '@beyond-js/kernel/bundle';

export /*bundle*/
class V1Styles extends Events {
    get engine() {
        return 'v1';
    }

    /**
     * The bundle object
     *
     * @type {Bundle}
     * @private
     */
    readonly #bundle: Bundle;
    get bundle() {
        return this.#bundle;
    }

    /**
     * The autoincremental HMR version
     *
     * @type {number}
     * @private
     */
    #version = 0;
    get version() {
        return this.#version;
    }

    /**
     * The href without the version qs parameter
     *
     * @type {string}
     * @private
     */
    readonly #resource: string;
    get resource() {
        return this.#resource;
    }

    /**
     * The url of the stylesheet including the HMR version qs parameter
     *
     * @return {string}
     */
    get href(): string {
        const version = this.#version ? `?version=${this.#version}` : '';
        return `${this.#resource}${version}`;
    }

    constructor(resource: string) {
        super();
        this.#bundle = bundles.get(resource);

        this.#resource = (() => {
            if (typeof process === 'object') {
                const split = resource.split('/');
                const pkg = split[0].startsWith('@') ? `${split.shift()}/${split.shift()}` : split.shift();
                const subpath = split.join('/');
                return `##_!${pkg}!_##${subpath}.css`;
            }

            let {uri} = this.#bundle;

            /**
             * validate if the uri belongs to the CDN
             */
            const regexp = new RegExp('^https?://cdn.beyondjs.com', 'i');
            if (regexp.test(uri)) {
                const {origin, pathname, searchParams} = new URL(uri);
                const version = searchParams.has('version') ? `&version=${searchParams.get('version')}` : '';

                return origin + pathname + '?css' + version;
            }

            uri = uri.slice(0, uri.length - 3); // Remove the .js extension
            return `${uri}.css`;
        })();
    }

    /**
     * Called by HMR in development environment
     */
    change() {
        this.#version++;
        this.trigger('change');
    }
}
