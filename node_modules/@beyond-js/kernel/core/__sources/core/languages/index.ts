import {Events} from "../utils/events/events";

declare const bimport: (resource: string, version?: number) => Promise<any>;

export interface ILanguagesSpecs {
    // The value to be taken when the device language (or the previously local configured) is not supported
    default: string,
    supported: string[]
}

export /*bundle*/
class Languages extends Events {
    #project;
    #specs: ILanguagesSpecs;
    #storage: Storage = typeof localStorage === 'object' ? localStorage : void 0;

    #supported: Set<string>;
    get supported() {
        return this.#supported;
    }

    get default() {
        return this.#specs?.default;
    }

    #current: string;
    get current(): string {
        return this.#current;
    }

    #resolve: (p: void) => void;
    #ready = new Promise(resolve => this.#resolve = resolve);
    get ready() {
        return this.#ready;
    }

    #fetched = false;
    get fetched() {
        return this.#fetched;
    }

    constructor(project: string) {
        super();
        this.#project = project;
        bimport(`${project}/config`).then(({default: config}) => {
            this.#setup(config.languages);
            this.#fetched = true;
            this.#resolve();
        });
    }

    #configure(value: string) {
        if (this.#current === value) return true;

        if (typeof value !== 'string' || value.length !== 2) {
            console.warn(`Configured language "${value}" is invalid`);
            return false;
        }

        if (value && !this.#supported.has(value)) {
            console.log(`Language "${value}" is not supported`);
            return false;
        }

        const previous = this.#current;
        this.#current = value;
        previous && this.trigger('change');
        return true;
    }

    set current(value: string) {
        if (!this.#configure(value)) return;
        this.#storage?.setItem('__beyond_language', value);
    }

    #setup(specs: ILanguagesSpecs) {
        // Check if the default language is valid
        if (specs.default && typeof specs.default !== 'string' || specs.default.length !== 2) {
            console.log(`Default language "${specs.default}" is invalid`);
            specs.default = undefined;
        }

        // Check the supported languages, if not set, default will be english
        const def = specs.default ? specs.default : 'en';
        specs.supported = specs.supported instanceof Array ? specs.supported : [def];
        !specs.supported.length && specs.supported.push(def);
        this.#supported = new Set(specs.supported);

        // If default language not set or was invalid, take the first supported language
        specs.default = specs.default ? specs.default : [...this.#supported][0];

        // If default language was configured, but not set in the supported list, warn it
        if (!this.#supported.has(specs.default)) {
            console.warn(`Default language "${specs.default}" is not supported by current application`);
            specs.default = [...this.#supported][0];
        }

        this.#specs = specs;

        const configured = this.#storage?.getItem('__beyond_language');

        // Try to configure the locally previously configured language
        if (configured && this.#configure(configured)) return;

        // Try to configure the language configured in the device
        const device = typeof location === 'object' ? navigator.language.split('-')[0] : void 0;
        if (device && this.#configure(device)) return;

        this.#configure(specs.default);
    }
}

export /*bundle*/ const languages = new Languages((<any>globalThis).__app_package.specifier);
