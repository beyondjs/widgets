import {instances as bundles, Package} from '@beyond-js/kernel/bundle';
import {Events} from '@beyond-js/kernel/core';
import {styles as registry} from './registry';
import {V1Styles} from './v1';

export /*bundle*/
class DependenciesStyles extends Events {
    readonly #vspecifier: string;
    readonly #elements: Set<V1Styles>;
    get elements() {
        return this.#elements;
    }

    constructor(vspecifier: string) {
        super();
        this.#vspecifier = vspecifier;

        const change = () => this.trigger('change');

        this.#elements = new Set();
        const recursive = (vspecifier: string) => {
            if (!vspecifier) {
                console.trace('Bundle vspecifier not defined');
                return;
            }

            if (!bundles.has(vspecifier)) {
                console.error(`Bundle id "${vspecifier}" not found. Try refreshing the page.\n` +
                    `If the problem still persist, delete the BeyondJS cache and try again.`);
                return;
            }
            const bundle = bundles.get(vspecifier);
            if (vspecifier !== this.#vspecifier && bundle.type === 'widget') return;

            // Check if the bundle has styles
            const styles = <V1Styles>registry.get(vspecifier);
            if (styles && styles.engine !== 'legacy') {
                this.#elements.add(styles);
                styles.on('change', change);
            }

            const {dependencies} = bundle.package();
            dependencies.forEach((dependency: any) => {
                const pkg: Package = dependency.__beyond_pkg;
                if (!pkg) return;

                recursive(pkg.vspecifier);
            });
        }
        recursive(this.#vspecifier);
    }
}
