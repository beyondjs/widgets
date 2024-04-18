import {HistoryPosition} from "./position";
import {HistoryRecords} from "./records";
import type {Routing, RoutingMode} from "../routing";

/**
 * Beyond keeps its own history list
 * @constructor
 */
export class BeyondHistory {
    readonly #position: HistoryPosition;
    get position() {
        return this.#position;
    }

    readonly #records: HistoryRecords;
    get records() {
        return this.#records;
    }

    get valid() {
        return this.#records.valid;
    }

    get current(): string {
        return this.valid ? this.#records.current.uri : void 0;
    }

    #initial: number = history.length;
    get initial(): number {
        return this.#initial;
    }

    /**
     * Process the browser URI that takes into consideration the routing mode
     *
     * @param {string} uri The internal URI (always starts with '/')
     * @return {string} The URI to be pushed or replaced in the browser considering the routing mode
     * @private
     */
    #processBrowserURI(uri: string): string {
        void (this);
        if (uri === void 0) return;

        const {routing} = require('../routing');
        const RoutingModeEnum = <typeof RoutingMode>(require('../routing')).RoutingMode;

        return routing.mode === RoutingModeEnum.Hash ? `#${uri.substr(1)}` : uri;
    }

    #push(uri: string) {
        this.#records.reset();
        this.#records.push(uri);
        this.#position.save(this.#records.length);
    }

    replaceState(state: any, title: string, uri: string) {
        state = state ? state : {};
        if (typeof state !== 'object') throw new Error('Invalid state parameter');

        this.#records.updateCurrentURI(uri);

        // The uri in the browser considering the routing mode
        const position = this.#position.value;
        history.replaceState(state, title, this.#processBrowserURI(uri));
        this.#position.save(position);
    }

    pushState(uri: string, state: any) {
        if (uri === `${location.pathname}${location.search}${location.hash}`) return;

        state = state ? state : {};
        if (typeof state !== 'object') throw new Error('Invalid state parameter');

        history.pushState(state, null, this.#processBrowserURI(uri));
        this.#push(uri);
    }

    back() {
        const previous = this.#records.previous?.position;
        const current = this.#records.current?.position;
        if (!previous) return;
        history.go(previous - current);
    }

    forward() {
        const following = this.#records.following?.position;
        const current = this.#records.current?.position;
        if (!following) return;
        history.go(following - current);
    }

    constructor(routing: Routing, Mode: typeof RoutingMode) {
        this.#position = new HistoryPosition();
        this.#records = new HistoryRecords(this.#position);

        if (this.#position.value === void 0) {
            // It is not a refresh of a previously navigated page
            let uri = routing.mode === Mode.Hash ? location.hash.slice(1) :
                `${location.pathname}${location.search}${location.hash}`;
            this.#push(uri);
        }
    }
}
