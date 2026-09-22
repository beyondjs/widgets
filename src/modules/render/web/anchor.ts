import { routing } from '@beyond-js/kernel/routing';

declare const process: any;

/**
 * An element that navigates the application to its `data-url` when clicked. The routing is imported
 * statically: on the Engine it was loaded on demand through `bimport`, which the development runtime
 * resolves through the import map of the page, where only the modules of the graph are known.
 */
typeof process !== 'object' &&
	customElements.define(
		'beyond-link',
		class extends HTMLElement {
			#listener = () => {
				if (!this.hasAttribute('data-url')) return;
				routing.pushState(this.getAttribute('data-url'));
			};

			connectedCallback() {
				this.addEventListener('click', this.#listener);
			}

			disconnectedCallback() {
				this.removeEventListener('click', this.#listener);
			}
		}
	);
