import './brequire';
import type {Require} from './requirejs';

declare const amd_require: Require;

/**
 * Import a module, solving internally the module format (amd, esm).
 *
 * When running in a BEE, brequire and bimport are implemented by it, overriding both functions.
 *
 * @param resource {string} The resource identifier of the bundle
 * @param version {number} The version required by hmr to update a bundle's processor
 * @returns {Promise<*>}
 */
export /*bundle*/ function bimport(resource: string, version?: number): Promise<any> {
    if (bimport.mode === 'amd') {
        return new Promise<any>((resolve, reject) => {
            if (typeof resource !== "string") throw 'Invalid module parameter';
            resource = resource.endsWith('.js') ? resource.slice(0, resource.length - 3) : resource;

            const error = new Error(`Error loading or processing module "${resource}"`);
            amd_require([resource],
                (returned: any) => resolve(returned),
                (exc: Error) => {
                    console.error(`Error loading resource "${resource}".`);
                    console.log(exc.stack);
                    reject(error);
                }
            );
        });
    } else if (bimport.mode === 'sjs') {
        return (<any>globalThis).System.import(resource + (version ? `?version=${version}` : ''));
    } else {
        return import(resource + (version ? `?version=${version}` : ''));
    }
}

bimport.mode = (() => {
    if (typeof amd_require === 'function') return 'amd';
    const {System} = (<any>globalThis);
    if (typeof System === 'object' && typeof System.import === 'function') return 'sjs';
    return 'esm';
})();

const appDependencies = (() => {
    const dependencies = (<any>globalThis).__app_package?.dependencies;
    return new Map(dependencies);
})();

bimport.resolve = ((specifier: string, dependencies: any): string => {
    if (/^https?:\/\//.test(specifier)) return specifier;

    const split = specifier.split('/');
    const pkg = split[0].startsWith('@') ? `${split.shift()}/${split.shift()}` : split.shift();

    const version = (() => {
        if (dependencies.has(pkg)) return dependencies.get(pkg);
        if (appDependencies.has(pkg)) return appDependencies.get(pkg);
    })();
    if (!version) return specifier;

    const subpath = split.join('/');
    return `${pkg}@${version}` + (subpath ? `/${subpath}` : '');
});
