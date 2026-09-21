import { Events } from '@beyond-js/kernel/core';
import type { BeyondWidget } from './';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export /*bundle*/
interface IBeyondWidgetController {
	initialise: () => Promise<void>;
	attributeChanged: (name: string, old: string, value: string) => void;
	disconnect: () => void;
	reconnect?: () => void;
}

/**
 * The client rendering of a widget: the import of its module, the construction of its controller and the
 * moments the element allows it to mount.
 *
 * The module is imported when the element is constructed and the controller is created once the element
 * is connected and the server paths completed. An element that is disconnected before its module arrived
 * does not mount: the import completes, nothing is constructed, and a later connection mounts it then. A
 * disconnected controller is told so, and told again when its element is connected again.
 */
export /*bundle*/
class WidgetCSR extends Events {
	readonly #widget: BeyondWidget;

	#bundle: any;
	get bundle() {
		return this.#bundle;
	}

	#controller: IBeyondWidgetController;
	get controller() {
		return this.#controller;
	}

	#error: string;
	get error() {
		return this.#error;
	}

	#loading: boolean = false;
	get loading() {
		return this.#loading;
	}

	#loaded: boolean = false;
	get loaded() {
		return this.#loaded;
	}

	#holders = new Set(['initialised', 'loaded']);

	/**
	 * Whether the element is connected, as far as this object was told
	 */
	#connected = false;

	initialise() {
		// Check if CSR is enabled (default) for this widget
		if (!this.#widget.specs.render.csr) return;

		this.#connected = true;
		this.#holders.delete('initialised');
		this.#render();
	}

	constructor(widget: BeyondWidget) {
		super();
		const { specifier, specs } = (this.#widget = widget);

		// Check if CSR is enabled (default) for this widget
		if (!specs.render.csr) return;

		this.#loading = true;
		bimport(specifier)
			.then((bundle: any) => {
				this.#bundle = bundle;
				this.#loading = false;
				this.#loaded = true;
				this.#holders.delete('loaded');
				this.#render();
			})
			.catch((exc: Error) => {
				console.error(`Error loading widget "${specifier}"`, exc.stack);
				this.#error = exc.message;
				this.#loading = false;
			});
	}

	#render = () => {
		// Render the widget once the connectedCallback is called and the bundle was imported
		if (this.#holders.size || this.#controller) return;

		// An element that was disconnected while its module was loading mounts when it is connected again
		if (!this.#connected || !this.#widget.isConnected) return;

		const { Controller } = this.#bundle;
		if (!Controller || typeof Controller !== 'function') {
			const message = `Widget "${this.#widget.localName}" does not export its Controller`;
			console.error(message);
			this.#error = message;
			return;
		}

		this.#controller = new Controller(this.#widget);
		this.#controller
			.initialise()
			.then(() => this.trigger('controller.initialised'))
			.catch((exc: Error) => console.log(exc instanceof Error ? exc.stack : exc));
	};

	disconnect() {
		this.#connected = false;
		this.#controller?.disconnect?.();
	}

	reconnect() {
		this.#connected = true;
		this.#controller ? this.#controller.reconnect?.() : this.#render();
	}

	attributeChanged(name: string, old: string, value: string) {
		this.#controller?.attributeChanged(name, old, value);
	}
}
