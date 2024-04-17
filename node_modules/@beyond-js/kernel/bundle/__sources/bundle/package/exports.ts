import type {Require} from './ims/require';
import {Trace} from './ims/require/trace';

/**
 * Interface is also required by @beyond-js/kernel/transversals
 */
export /*bundle*/
interface IExportsDescriptor {
    im: string,
    from: string,
    name: string
}

export default class {
    #require: Require;
    #values: Record<string, any> = {};
    get values() {
        return this.#values;
    }

    /**
     * Property is set by the bundle file, or by the transversal
     * @type {{im: string, from: string, name: string}[]}
     */
    descriptor: IExportsDescriptor[];

    /**
     * Property is set by the bundle file to process the module exports (es6, cjs, amd)
     * @type {(require: (id: string) => any) => {void(require)}}
     */
    process: (params: { require?: (id: string) => any, prop?: string, value?: string }) => void;

    constructor(require: Require) {
        this.#require = require;
        this.#values.hmr = {
            on: (event: string, listener: any) => require.pkg.hmr.on(event, listener),
            off: (event: string, listener: any) => require.pkg.hmr.off(event, listener)
        }

        this.#values.__beyond_pkg = this.#require.pkg;
    }

    // Used by the IM exports proxy to update the value of the bundle exported property when
    // the property is changed in the IM
    set(key: string, value: string) {
        this.#values[key] = value;
    }

    update() {
        const require = (id: string) => {
            const trace = new Trace();
            trace.register('exports.update', id);
            return this.#require.solve(id, trace);
        }

        this.process?.({require});

        // Clean all previous values
        const reserved = ['__beyond_pkg', 'hmr'];
        Object.keys(this.#values).forEach(p => !reserved.includes(p) && delete this.#values[p]);

        this.descriptor?.forEach(({im, from, name}) => {
            const trace = new Trace();
            this.#values[name] = this.#require.solve(im, trace)[from];
        });
    }
}
