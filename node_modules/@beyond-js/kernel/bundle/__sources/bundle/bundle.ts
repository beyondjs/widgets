import {Package} from "./package";
import {instances} from "./instances";
import {Module, IModuleSpecs} from "./module";
import './bimport';

export /*bundle*/
interface IBundleSpecs {
    module: IModuleSpecs,
    type: string,
    name?: string
}

export /*bundle*/
class Bundle extends Map<string, Package> {
    readonly #type: string;
    get type() {
        return this.#type;
    }

    readonly #name: string;
    get name() {
        return this.#name;
    }

    readonly #vspecifier: string;
    get vspecifier() {
        return this.#vspecifier;
    }

    readonly #specifier: string;
    get specifier() {
        return this.#specifier;
    }

    readonly #module: Module;
    get module() {
        return this.#module;
    }

    readonly #uri: string;
    get uri() {
        return this.#uri;
    }

    constructor(specs: IBundleSpecs, uri?: string) {
        super();

        if (typeof specs !== 'object') throw new Error('Bundle creation specification is not defined');

        const name = this.#name = specs.name ? specs.name : specs.type;
        if (!name) throw new Error('Invalid bundle creation specification');

        this.#module = new Module(specs.module);
        this.#uri = uri;
        this.#type = specs.type;

        const {multibundle, vspecifier, specifier} = this.#module;
        this.#vspecifier = multibundle ? `${vspecifier}.${name}` : vspecifier;
        this.#specifier = multibundle ? `${specifier}.${name}` : specifier;

        instances.register(this);
    }

    package(language?: string): Package {
        if (language && language.length !== 2) throw new Error(`Language "${language}" is invalid`);
        language = !language ? '' : language;

        if (this.has(language)) return this.get(language);

        const pkg = new Package(this, language);
        this.set(language, pkg);
        return pkg;
    }
}
