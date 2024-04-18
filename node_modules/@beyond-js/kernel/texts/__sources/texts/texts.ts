import {Events} from '@beyond-js/kernel/core';

declare const bimport: (specifier: string, version?: number) => Promise<any>;

interface IWidgetStore {
    toJSON(): object | void;

    hydrate?(cached: object): Promise<void>;

    fetch(): Promise<void>;
}

export /*bundle*/
class Texts<TextsDeclaration> extends Events implements IWidgetStore {
    /**
     * The module resource
     * @type {string}
     * @private
     */
    readonly #module: string;
    get module() {
        return this.#module;
    }

    /**
     * The bundle name. Ex: 'txt'
     * @type {string}
     * @private
     */
    readonly #bundle: string;
    get bundle() {
        return this.#bundle;
    }

    /**
     * The transversal bundle name. Ex: 'txt-menu'
     * @type {string}
     * @private
     */
    readonly #transversal: string;
    get transversal() {
        return this.#transversal;
    }

    readonly #multilanguage: boolean;
    get multilanguage() {
        return this.#multilanguage;
    }

    readonly #language: string;
    get language() {
        return this.#language;
    }

    // The loaded bundle
    #texts: any;

    #loaded = false;
    get loaded() {
        return this.#loaded;
    }

    #loading: boolean;
    get loading() {
        return this.#loading;
    }

    get value(): TextsDeclaration {
        return this.#texts?.txt;
    }

    get ready() {
        if (this.#loading) return false;
        this.fetch().catch(exc => console.log(exc.stack));
        return !this.#loading && this.#loaded;
    }

    /**
     * Module texts constructor
     *
     * @param {string} module The module resource
     * @param {{transversal: string, language: string}} specs
     */
    constructor(module: string, specs: { transversal?: string, language?: string, bundle?: string }) {
        if (!module) throw new Error('Invalid parameters');

        super();
        this.#module = module;
        specs = specs ? specs : {};

        this.#language = specs.language;
        this.#multilanguage = !!specs.language;
        this.#bundle = !specs.transversal ? (specs.bundle ? specs.bundle : 'txt') : void 0;
        this.#transversal = specs.transversal;
    }

    // Used by HMR when packaged has been updated
    #update = () => this.trigger('change');

    async fetch() {
        if (this.#loading || this.#loaded) return;

        this.#loading = true;
        this.trigger('change');

        const language = this.#language ? `.${this.#language}` : '';

        const {specifier, resource} = (() => {
            if (this.#transversal) {
                const specifier = `${this.#module}.${this.#transversal}${language}`;
                const pkg = (() => {
                    const split = this.#module.split('/');
                    return split[0].startsWith('@') ? `${split[0]}/${split[1]}` : split[0];
                })();
                const resource = `${pkg}/${this.#transversal}${language}`;
                return {specifier, resource};
            } else {
                const specifier = `${this.#module}.${this.#bundle}${language}`;
                return {specifier, resource: specifier};
            }
        })();

        const imported = await bimport(resource);

        this.#texts = (() => {
            if (!this.#transversal) return imported;

            const {__beyond_transversal: transversal} = imported;
            return transversal.bundles.get(specifier);
        })();

        this.#texts.hmr.on('change', this.#update);

        this.#loading = false;
        this.#loaded = true;
        this.trigger('change');
    }

    /**
     * @deprecated Deprecated method. Use .fetch instead
     * @return {Promise<void>}
     */
    async load() {
        await this.fetch();
    }

    destroy() {
        this.#texts?.hmr.off('change', this.#update);
    }

    toJSON() {
        return {};
    }
}
