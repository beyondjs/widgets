import {CancellationToken} from '@beyond-js/kernel/core';
import {routing, URI} from '@beyond-js/kernel/routing';
import {Layout} from "./layouts/layout";
import {PageInstance} from "./pages/instance";
import Pages from "./pages";
import Layouts from "./layouts";
import {Route} from './route';

declare const bimport: (resource: string, version?: number) => Promise<any>;
declare const process: any;

export /*bundle*/
const manager = typeof process === 'object' ? void 0 : new class Manager {
    // The registry of all layouts (except the main layout) and pages instances registered in the session
    readonly #instances = {layouts: new Layouts(), pages: new Pages()};

    #initialised = false;
    get initialised() {
        return this.#initialised;
    }

    #resolve: any;
    #ready = new Promise(resolve => this.#resolve = resolve);
    get ready() {
        return this.#ready;
    }

    constructor() {
        const set = () => this.set(routing.uri).catch(exc => console.log(exc.stack));

        // @TODO: move to the setup method
        const {specifier} = (<any>globalThis).__app_package;
        Promise.all([
            bimport(`${specifier}/config`),
            bimport(`${specifier}/start`)
        ]).then(([{default: config}]) => {
            this.#main = new Layout(this.#instances.layouts, config.layout);

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

    // The main layout can be the layout set in the project.json, or the beyond-layout-children
    // set when the project does not have set a layout
    #main: Layout;
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
        }

        const {page: element} = route;
        if (!element) {
            console.error(`Pathname "${uri.pathname}" does not have a page widget associated to it`);
            return done();
        }

        const page: PageInstance = this.#instances.pages.register(uri, route);

        // Property page.parents is an array that contains the descending list of layouts where the page is contained
        const {error, value: descending} = page.parents;
        if (error) {
            console.error(`Page on "${uri.uri}" cannot be shown: ${error}`);
            return done();
        }

        this.#main.select(page, descending);
        return done();
    }
}
