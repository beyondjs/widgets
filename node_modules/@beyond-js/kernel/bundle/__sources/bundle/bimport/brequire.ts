import instances from "../package/instances";

/**
 * Require a previously loaded bundle synchronously:
 * (can be a project bundle or library bundle, or an external bundle).
 *
 * brequire is implemented for internal use, as the require function available in the internal modules
 * exposes this functionality.
 * In fact the require of the internal modules internally makes use of brequire.
 *
 * When running in a BEE, brequire and bimport are implemented by it, overriding both functions.
 *
 * @param {string} specifier
 * @return {*}
 */
export /*bundle*/ function brequire(specifier: string): any {
    const split = specifier.split('/');
    const pkg = split[0].startsWith('@') ? `${split.shift()}/${split.shift()}` : split.shift();
    const subpath = split.join('/');

    const found = [...instances].find(([vspecifier]) => {
        if (!vspecifier.startsWith(`${pkg}@`)) return;
        const split = vspecifier.slice(pkg.length).split('/');
        split.shift(); // Remove the version of the specifier of the instance
        return subpath === split.join('/');
    });
    if (!found) return;

    !found[1].initialised && found[1].initialise();
    return found[1].exports.values;
}
