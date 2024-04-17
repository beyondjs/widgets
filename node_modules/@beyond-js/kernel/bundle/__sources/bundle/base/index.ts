/**
 * Resolve the id of a module considering relatives paths to the source that is requiring it
 *
 * @param source {string} The module from where the require is being requested
 * @param id {string} The module being requested
 * @returns {string} The module processed with relative paths
 */
import type {IMSpecs} from "../package/ims/im";

export function resolve(source: string, id: string) {
    if (!id.startsWith('.')) throw new Error(`Module id must be a relative resource "${id}"`);

    interface Split {
        source?: string[],
        target?: string[]
    }

    const split: Split = {};
    split.source = source.split('/');
    split.source.pop();
    split.target = (id.startsWith('./') ? id.slice(2) : id).split('../');
    while (split.target[0] === '' && split.target.length > 1) {
        split.target.shift();
        split.source.pop();
    }

    return split.source.join('/') + '/' + split.target.join('/');
}

/**
 * This class is used only by beyond/core
 */
export class BeyondPackage {
    #ims: Map<string, IMSpecs>;
    readonly #cached: Map<string, Record<string, any>> = new Map();

    #exports: any;

    constructor(exports: any) {
        this.#exports = exports;
    }

    initialise(ims?: Map<string, IMSpecs>) {
        this.#ims = ims;
        this.#exports.process((id: string, source?: string): any => this.require(id, source), {});
    }

    /**
     * Solve the require function
     *
     * @param source {string} The module from where the require is being triggered
     * @param id {string} The module id being requested
     * @returns {*}
     */
    require(id: string, source?: string): any {
        id = source ? resolve(source, id) : id;

        const module = (() => {
            if (this.#ims.has(id)) return id;
            return id.endsWith('/') ? `${id}index` : `${id}/index`;
        })();

        if (this.#cached.has(module)) return this.#cached.get(module);
        if (!this.#ims.has(module)) throw new Error(`Internal module "${id}" not found`);

        const fn = this.#ims.get(module).creator;
        const require = (required: string) => this.require(required, module); // Here the id is the source of the require
        const exports = {};
        fn(require, exports);

        this.#cached.set(module, exports);
        return exports;
    }
}
