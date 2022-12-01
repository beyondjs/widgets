import {Events} from '@beyond-js/kernel/core';
import type {BeyondWidget} from '../';
import Link from './link';
import {GlobalCSS} from './global';

export /*bundle*/
class StylesManager {
    readonly #events: Events = new Events();
    on = (event: string, listener: () => void) => this.#events.on(event, listener);
    off = (event: string, listener: () => void) => this.#events.off(event, listener);

    readonly #loaded: Map<string, boolean> = new Map();
    readonly #globalcss: GlobalCSS;

    #version = 0;
    get version() {
        return this.#version;
    }

    #changed() {
        this.#version++;
        this.#resolved && this.#events.trigger('change');
    }

    get resources() {
        return new Set([...this.#loaded.keys()]);
    }

    get loaded() {
        this.#check();
        return this.#resolved;
    }

    readonly #promise: Promise<void>;
    #resolved = false;
    #resolve: () => void;

    get ready(): Promise<void> {
        this.#check();
        return this.#promise;
    }

    onloaded = (event: Event | string): boolean => {
        const href = typeof event === 'string' ? event :
            (<HTMLLinkElement>event.currentTarget).getAttribute('href');
        if (!this.#loaded.has(href)) {
            console.warn(`Stylesheet href="${href}" not registered`);
            return;
        }

        this.#loaded.set(href, true);
        this.#check();
        const changed = this.#purge();
        changed && this.#changed();

        return true;
    }

    #check() {
        if (this.#resolved) return true;

        // Check if all links are loaded
        const loaded = [...this.#loaded.values()].reduce((prev, loaded) => prev && loaded, true);
        loaded && this.#resolve();

        return this.#resolved = loaded;
    }

    /**
     * Remove style sheets that have been supplanted by newer hmr versions
     * @private
     */
    #purge(): boolean {
        const versions: { last: Map<string, number>, values: Map<string, Set<number>>, lastLoaded: Map<string, number> } =
            {last: new Map(), values: new Map(), lastLoaded: new Map()};

        [...this.#loaded.keys()].forEach(href => {
            const link = new Link(href);
            const prevLast = versions.last.get(link.resource);
            const last = prevLast && prevLast > link.version ? prevLast : link.version;
            versions.last.set(link.resource, last);

            if (this.#loaded.get(link.href)) {
                const prevLastLoaded = versions.lastLoaded.get(link.resource);
                const lastLoaded = prevLastLoaded && prevLastLoaded > link.version ? prevLastLoaded : link.version;
                versions.lastLoaded.set(link.resource, lastLoaded);
            }

            const values: Set<number> = versions.values.has(link.resource) ? versions.values.get(link.resource) : new Set();
            values.add(link.version);
            versions.values.set(link.resource, values);
        });

        // Just keep the last loaded version and the loading versions
        const purge: Link[] = [];
        [...this.#loaded.keys()].forEach(href => {
            const link = new Link(href);
            const lastLoaded = versions.lastLoaded.get(link.resource);
            link.version < lastLoaded && purge.push(link);
        });

        purge.forEach(link => this.#loaded.delete(link.href));
        return !!purge.length;
    }

    /**
     * Required to support global.css HMR
     *
     * @type {string[]}
     * @private
     */
    #last: string[];
    #refresh = () => {
        if (!this.#last) return;
        const changed = this.#update(this.#last);
        changed && this.#changed();
    }

    #update(_links?: string[]): boolean {
        this.#last = _links;

        _links.unshift(this.#globalcss.link);
        const links: Link[] = _links.map(link => new Link(link));

        // Add the new style sheets
        let changed = false;
        links.forEach(link => {
            if (this.#loaded.has(link.href)) return;
            this.#loaded.set(link.href, false);
            changed = true;
        });
        return changed;
    }

    update(links: string[]) {
        const changed = this.#update(links);
        changed && this.#changed();
    }

    constructor(widget: BeyondWidget) {
        this.#globalcss = new GlobalCSS(widget);
        this.#promise = new Promise(resolve => this.#resolve = resolve);
    }

    #initialised = false;
    get initialised() {
        return this.#initialised;
    }

    async initialise(links: string[]) {
        if (this.#initialised) throw new Error(`Widget styles already initialised`);
        this.#initialised = true;

        this.#update(links);
        this.#globalcss.on('change', this.#refresh);
    }

    destroy() {
        this.#globalcss.off('change', this.#refresh);
    }
}
