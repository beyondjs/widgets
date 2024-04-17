import {URI} from "./uri/uri";
import {Events, CancellationToken} from "@beyond-js/kernel/core";
import {BeyondHistory} from "./history/history";

declare const bimport: (resource: string, version?: number) => Promise<any>;

export enum RoutingMode {Hash, Pathname}

const serverside = typeof process === 'object';

export class Routing extends Events {
    #mode: RoutingMode;
    get mode() {
        return this.#mode;
    }

    #history: BeyondHistory;
    get history() {
        return this.#history;
    }

    #initialised = false;
    get initialised() {
        return this.#initialised;
    }

    #resolve: any;
    #ready = new Promise(resolve => this.#resolve = resolve);
    get ready() {
        return this.#ready;
    }

    #uri: URI;
    get uri(): URI {
        return this.#uri;
    }

    missing: (pathname: string) => Promise<string>;
    redirect: (uri: URI) => Promise<string>;

    #resolveConfigured: any;
    #configured = new Promise(resolve => this.#resolveConfigured = resolve);

    constructor() {
        super();

        // @TODO: move to some kind of initialization / setup
        const {specifier} = (<any>globalThis).__app_package;
        !serverside && bimport(`${specifier}/config`).then(({default: config}) => {
            let configured = config.routing?.mode;
            let routingMode: number = configured === 'hash' ? RoutingMode.Hash : RoutingMode.Pathname;
            location.protocol === 'file:' && (routingMode = RoutingMode.Hash);

            ![0, 1].includes(routingMode) &&
            (routingMode = location.protocol === 'file:' ? RoutingMode.Hash : RoutingMode.Pathname);

            this.#mode = routingMode;

            this.#history = new BeyondHistory(this, RoutingMode);
            this.#resolveConfigured();
        });
    }

    #redirect = async (uri: URI): Promise<boolean> => {
        if (typeof this.redirect !== 'function') return;

        const redirected = await this.redirect(uri);
        if (!redirected) return;
        if (typeof redirected !== 'string') {
            console.error(`Invalid route value set by custom routing function`, redirected);
            return;
        }

        if (uri.pathname === redirected) return; // Routing function returned the actual route

        this.pushState(redirected);
        return true;
    };

    pushState(uri: string, state?: object): void {
        this.#configured.then(() => {
            this.#history.pushState(uri, state);
            this.update().catch((exc) => console.error(exc.stack));
        });
    };

    replaceState(state: object, title: string, uri?: string): void {
        this.#configured.then(() => {
            this.#history.replaceState(state, title, uri);
            this.update().catch((exc) => console.error(exc.stack));
        });
    };

    // Avoid to continue the execution on asynchronous calls, when a newest call's been made
    #cancellationToken = new CancellationToken;
    update = async () => {
        const cancellationTokenId = this.#cancellationToken.reset();

        const {hash, pathname, search} = location;
        const _uri = this.#mode === RoutingMode.Hash ? `/${hash.slice(1)}` : pathname + search + hash;
        if (this.#uri?.uri === _uri) return;

        const uri = this.#uri = new URI(_uri);

        // Check for uri redirect
        const redirected = await this.#redirect(uri);
        if (!this.#cancellationToken.check(cancellationTokenId)) return;
        if (redirected) return; // The page was redirected to another uri

        // Verify the state of the history registry to check for possible errors
        this.#history && uri.uri !== this.#history.current &&
        console.error(`History current "${this.#history.current}" is not equal to actual uri "${uri.uri}"`);

        this.#initialised ? this.trigger('change') : this.#resolve();
        this.#initialised = true;
    };

    // Wait for start.js be completed, as routing.redirect must be set before initialising routing
    #started = false;

    setup() {
        this.#started = true;
        !serverside && this.update().catch(exc => console.error(exc.stack));
    }

    back() {
        this.#history.back();
    }

    forward() {
        this.#history.forward();
    }
}

export /*bundle*/ const routing = new Routing;

(globalThis as any).routing = routing;

// Just for backward compatibility
declare const beyond: any;
!serverside && ((<any>beyond).navigate = (uri: string, state?: object) => routing.pushState(uri, state));
!serverside && ((<any>beyond).pushState = (uri: string, state?: object) => routing.pushState(uri, state));
!serverside && ((<any>beyond).back = () => routing.back());
!serverside && ((<any>beyond).forward = () => routing.forward());

// Only on client side
!serverside && window.addEventListener('popstate', () =>
    routing.update().catch(exc => console.error(exc.stack)));
