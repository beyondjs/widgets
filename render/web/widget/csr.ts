import {Events} from '@beyond-js/kernel/core';
import type {BeyondWidget} from './';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export /*bundle*/
interface IBeyondWidgetController {
    initialise: () => Promise<void>;
    attributeChanged: (name: string, old: string, value: string) => void;
    disconnect: () => void;
}

export /*bundle*/
class WidgetCSR extends Events {
    readonly #widget: BeyondWidget;

    #bundle: any;
    get bundle() {
        return this.#bundle;
    }

    #controller: IBeyondWidgetController;
    get controller() {
        return this.#controller;
    }

    #error: string;
    get error() {
        return this.#error;
    }

    #loading: boolean = false;
    get loading() {
        return this.#loading;
    }

    #loaded: boolean = false;
    get loaded() {
        return this.#loaded;
    }

    #holders = new Set(['initialised', 'loaded']);

    initialise() {
        // Check if CSR is enabled (default) for this widget
        if (!this.#widget.specs.render.csr) return;

        if (!this.#holders.has('initialised')) throw new Error('Widget CSR already initialised');
        this.#holders.delete('initialised');
        this.#render();
    }

    constructor(widget: BeyondWidget) {
        super();
        const {specifier, specs} = this.#widget = widget;

        // Check if CSR is enabled (default) for this widget
        if (!specs.render.csr) return;

        bimport(specifier).then((bundle: any) => {
            this.#bundle = bundle;
            this.#loading = false;
            this.#loaded = true;
            this.#holders.delete('loaded');
            this.#render();
        }).catch((exc: Error) => {
            console.error(`Error loading widget "${specifier}"`, exc.stack);
            this.#error = exc.message;
            this.#loading = false;
        });
    }

    #render = () => {
        // Render the widget once the connectedCallback is called and the bundle was imported
        if (this.#holders.size) return;

        const {Controller} = this.#bundle;
        if (!Controller || typeof Controller !== 'function') {
            const message = `Widget "${this.#widget.localName}" does not export its Controller`;
            console.error(message);
            this.#error = message;
            return;
        }

        this.#controller = new Controller(this.#widget);
        this.#controller.initialise()
            .then(() => this.trigger('controller.initialised'))
            .catch((exc: Error) => console.log(exc instanceof Error ? exc.stack : exc));
    };

    disconnect() {
        this.#controller?.disconnect?.();
    }

    attributeChanged(name: string, old: string, value: string) {
        this.#controller?.attributeChanged(name, old, value);
    }
}
