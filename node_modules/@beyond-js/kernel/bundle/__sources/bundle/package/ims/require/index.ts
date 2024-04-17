import type {Package} from '../..';
import type {InternalModule} from '../im';
import {Trace} from './trace';
import {resolve} from '../../../base';

export class Require {
    readonly #pkg: Package;
    get pkg() {
        return this.#pkg;
    }

    constructor(pkg: Package) {
        this.#pkg = pkg;
    }

    /**
     * Solve a cjs require function
     *
     * @param {string} specifier The id of the internal module being required
     * @param {Trace} trace {object} The internal trace to find cyclical dependencies of internal modules
     * @param {InternalModule=} im The internal module that is making the call
     * @return {*}
     */
    solve(specifier: string, trace: Trace, im?: InternalModule): any {
        if (specifier.startsWith('.')) {
            // Relative require (internal module)
            specifier = im ? resolve(im.id, specifier) : specifier;
            return this.#pkg.ims.require(specifier, trace, im);
        }

        /**
         * It is a non-relative require
         */

        if (specifier === 'beyond_context') {
            const {bundle} = this.#pkg;
            return {module: bundle.module, bundle, pkg: this.#pkg};
        }

        // @beyond-js/kernel/transversals requires the Bundle object
        if (specifier === '@beyond-js/kernel/bundle') {
            const {Bundle} = require('../../../bundle');
            const {instances} = require('../../../instances');
            return {Bundle, instances};
        }

        const {dependencies} = this.#pkg;
        if (dependencies.has(specifier)) {
            /**
             * The package may not be initialized.
             * In principle, it is a feature required by transversals, but it could be applied to other use cases.
             */
            const {__beyond_pkg: pkg} = dependencies.get(specifier);
            typeof pkg === 'object' && !pkg.initialised && pkg.initialise();
            return dependencies.get(specifier);
        }

        const keys = JSON.stringify([...dependencies.keys()]);
        throw new Error(`Bundle "${specifier}" is not registered as a dependency: ${keys}`);
    }
}
