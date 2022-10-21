import {BeyondWidget, IWidgetSpecs} from './widget';
import {instances} from './instances';
import {attributes, Attributes} from './attributes';
import './anchor';

declare const process: any;

class BeyondWidgets extends Map<string, IWidgetSpecs> {
    #ssr = true;
    get ssr() {
        return this.#ssr;
    }

    constructor() {
        super();
    }

    setup(config: { ssr?: boolean }) {
        this.#ssr = typeof config?.ssr === 'boolean' ? config.ssr : true;
    }

    get instances(): typeof instances {
        return instances;
    }

    get attributes(): Attributes {
        return attributes;
    }

    register(specs: IWidgetSpecs[]) {
        specs.forEach((specs) => {
            // Widgets can be registered at application start, and later by the widget bundle
            if (this.has(specs.name)) return;

            specs.render = specs.render ? specs.render : {csr: true, ssr: false, sr: false};
            const {name, render} = specs;
            render.csr = typeof render.csr === 'boolean' ? render.csr : true;

            this.set(name, specs);

            // Do not register the custom elements when rendering in the server
            if (typeof process === 'object') return

            customElements.define(name, class extends BeyondWidget {
                static get observedAttributes() {
                    return specs.attrs ? specs.attrs : [];
                }

                constructor() {
                    super(specs);
                }
            });
        });
    }
}

export /*bundle*/ const widgets: BeyondWidgets = new BeyondWidgets();
