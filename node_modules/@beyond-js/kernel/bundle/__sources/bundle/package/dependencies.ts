import {Package} from "./";

export default class extends Map<string, any> {
    #pkg: Package;

    constructor(pkg: Package) {
        super();
        this.#pkg = pkg;
    }

    update(deps?: [string, any][]) {
        this.clear();

        deps?.forEach(([specifier, dependency]) => {
            if (!dependency) {
                throw new Error(`Dependency "${specifier}" not found on package "${this.#pkg.vspecifier}"`);
            }

            const {__beyond_transversal: transversal} = dependency;
            dependency = transversal ? transversal.bundles.get(specifier) : dependency;
            this.set(specifier, dependency);
        });
    }
}
