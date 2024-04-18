import {Bundle, Package, IMCreators, IExportsDescriptor, IBundleSpecs} from '@beyond-js/kernel/bundle';
import Dependencies from './dependencies';

interface ITransversalBundleCreator {
    (ims: IMCreators, exports: { descriptor?: IExportsDescriptor[] }): { dependencies: [string] }
}

type ITransversalBundleSpecs = [IBundleSpecs, ITransversalBundleCreator];

export /*bundle*/
class Transversal {
    readonly #name: string;
    get name() {
        return this.#name;
    }

    readonly #language: string;
    get language() {
        return this.#language;
    }

    readonly #bundles: Map<string, any> = new Map();
    get bundles() {
        return this.#bundles;
    }

    #dependencies = new Dependencies();
    get dependencies() {
        return this.#dependencies;
    }

    constructor(name: string, language?: string) {
        this.#name = name;
        this.#language = language;
    }

    #initialised = false;

    initialise(bundles: ITransversalBundleSpecs[]) {
        if (this.#initialised) throw new Error(`Transversal "${this.#name}" already initialised`);
        this.#initialised = true;

        const packages: Map<string, { pkg: Package, dependencies?: string[], ims: IMCreators }> = new Map();

        /**
         * First create the bundles and then initialize them,
         * to allow dependencies among bundles of the same traversal
         */
        bundles.forEach(([specs, creator]) => {
            const pkg = new Bundle(specs).package(this.#language);

            const ims: IMCreators = new Map();  // The internal modules map
            const exports: { descriptor?: IExportsDescriptor[] } = {}; // The exports.managed function

            // Execute the bundle creation function
            const response = creator(ims, exports);
            const {dependencies} = response ? response : {dependencies: void 0};

            // Set the descriptor of the exports
            pkg.exports.descriptor = exports.descriptor;

            // Store the package and its dependencies to register the dependencies once all the bundles
            // of the transversal are created
            packages.set(pkg.specifier, {pkg, dependencies, ims});
        });

        /**
         * Once all the bundles of the transversal are created,
         * then register all the dependencies of the packages
         */
        packages.forEach(({pkg, dependencies, ims}) => {
            const register: [string, any][] = (() => {
                const register: [string, any][] = [];
                dependencies?.forEach((specifier: string) => {
                    if (this.#dependencies.has(specifier)) {
                        register.push([specifier, this.#dependencies.get(specifier)]);
                        return;
                    }

                    // Check if dependency is a bundle of the transversal
                    if (!packages.has(specifier)) {
                        const data = `\n\tDependencies: ${JSON.stringify([...this.#dependencies.keys()])}. ` +
                            `\n\tBundles: ${JSON.stringify([...packages.keys()])}`;
                        throw new Error(`Dependency "${specifier}" not found on "${this.#name}" transversal. ${data}`);
                    }

                    const {pkg} = packages.get(specifier);
                    register.push([specifier, pkg.exports.values]);
                });
                return register;
            })();

            packages.forEach(({pkg}) => this.#bundles.set(pkg.specifier, pkg.exports.values));

            register && pkg.dependencies.update(register);

            // Register the ims, but do not initialise them until all bundles of the transversal are set
            // To allow dependencies among bundles
            pkg.ims.register(ims);
        });

        packages.forEach(({pkg}) => !pkg.initialised && pkg.initialise());
    }
}
