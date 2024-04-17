// Internal modules of the packager
import type {Package} from '..';
import type {Require} from './require';
import type {Trace} from './require/trace';
import {InternalModule, IMWrapperFunction, Exports, IMSpecs} from './im';

export /*bundle*/
type IMCreators = Map<string, IMSpecs>;

export class InternalModules {
    readonly #pkg: Package;
    readonly #ims: Map<string, InternalModule> = new Map();
    #require: Require;

    constructor(pkg: Package) {
        this.#pkg = pkg;
    }

    set _require(value: Require) {
        this.#require = value;
    }

    #register = (id: string, hash: number, creator: IMWrapperFunction) => {
        if (this.#ims.has(id)) throw new Error(`IM "${id}" already registered`);

        const im = new InternalModule(this.#pkg, id, hash, creator, this.#require);
        this.#ims.set(im.id, im);
    }

    register(ims: IMCreators) {
        ims.forEach(({creator, hash}, id) => this.#register(id, hash, creator));
    }

    require(id: string, trace: Trace, source: InternalModule): Exports {
        const module = (() => {
            if (this.#ims.has(id)) return id;
            return id.endsWith('/') ? `${id}index` : `${id}/index`;
        })();

        if (!this.#ims.has(module)) {
            throw new Error(`Internal module "${id}" not found`);
        }

        const im = this.#ims.get(module);
        return im.require(trace, source);
    }

    initialise() {
        this.#ims.forEach(im => im.initialise());
    }

    update(ims: IMCreators) {
        ims.forEach(({creator, hash}, id) => {
            if (!this.#ims.has(id)) {
                this.#register(id, hash, creator);
                return;
            }

            const im = this.#ims.get(id);
            if (im.hash === hash) return;
            im.update(creator, hash);
            this.#pkg.hmr.trigger(`${id}:change`);
        });
    }
}
