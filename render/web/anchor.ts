import type {routing as r} from '@beyond-js/kernel/routing';

declare const bimport: (resource: string, version?: number) => Promise<any>;
declare const process: any;

typeof process !== 'object' && customElements.define('beyond-link', class extends HTMLElement {
    #routing: typeof r;

    constructor() {
        super();
        bimport('@beyond-js/kernel/routing').then(({routing}) => this.#routing = routing);
    }

    connectedCallback() {
        this.addEventListener('click', () => {
            if (!this.hasAttribute('data-url')) return;

            const url = this.getAttribute('data-url');
            this.#routing?.pushState(url);
        });
    }
});
