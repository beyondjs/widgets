import { instances as bundles } from '@beyond-js/kernel/bundle';
import { instances } from '../instances';
import { NodeWidget } from '../instances/node';
import { WidgetSR } from './sr';
import { IBeyondWidgetController, WidgetCSR } from './csr';
import { WidgetSSR } from './ssr';
import { WidgetGlobalAttributes } from './attributes';
import { StylesManager } from './styles';

export /*bundle*/
interface IWidgetSpecs {
	name: string;
	vspecifier: string;
	attrs?: string[];
	is?: string;
	layout?: string;
	route?: string;

	/**
	 * Whether the package of the widget publishes a shared `global` stylesheet, which every widget of the
	 * package adopts in its root before its own sheets. The compiler sets it from the package declarations.
	 */
	global?: boolean;
	render: {
		multilanguage?: boolean;
		ssr: boolean;
		csr: boolean;
		sr: boolean;
	};
}

// In SSR environment HTMLElement is not defined
const Element = typeof HTMLElement === 'undefined' ? null : HTMLElement;

/**
 * The custom element of a widget: an open shadow root, a holder the view mounts in, and the client, server
 * and static render paths, sequenced so that server output is in the holder before the client controller
 * mounts, which is what lets a framework hydrate instead of rendering again.
 *
 * Resources are addressed from the module of the widget, never from the page: the base of a widget is the
 * identity prefix of its package as the module loader received it, so a widget embedded in a page of
 * another origin loads its shared stylesheet and its assets from where its code came from.
 */
export /*bundle*/
class BeyondWidget extends Element {
	readonly #specs: IWidgetSpecs;
	get specs(): IWidgetSpecs {
		return this.#specs;
	}

	get name() {
		return this.#specs.name;
	}

	get vspecifier() {
		return this.#specs.vspecifier;
	}

	readonly #specifier: string;
	get specifier() {
		return this.#specifier;
	}

	/**
	 * The address of the package of the widget, without the family and the subpath of the module
	 * (`…/m/<package>@<version>`), from the address the runtime loaded the module from. It ends without a
	 * slash. It is undefined until the module of the widget is loaded.
	 */
	get host(): string | undefined {
		const uri: string = bundles.get(this.#specs.vspecifier)?.uri;
		if (!uri) return;
		const [location] = uri.split('?');
		const at = location.lastIndexOf('/modules/');
		return at === -1 ? location.slice(0, location.lastIndexOf('/')) : location.slice(0, at);
	}

	/**
	 * The options the module of the widget was loaded with, which its companion resources are requested with
	 */
	get query(): string {
		const uri: string = bundles.get(this.#specs.vspecifier)?.uri ?? '';
		return uri.includes('?') ? uri.slice(uri.indexOf('?')) : '';
	}

	get is() {
		return this.#specs.is;
	}

	get route(): string {
		return this.#specs.route;
	}

	get layout(): string {
		return this.#specs.layout;
	}

	#holder: HTMLSpanElement;
	get holder() {
		return this.#holder;
	}

	readonly #sr: WidgetSR;
	get sr() {
		return this.#sr;
	}

	readonly #csr: WidgetCSR;
	get csr() {
		return this.#csr;
	}

	get controller(): IBeyondWidgetController {
		return this.#csr.controller;
	}

	readonly #ssr: WidgetSSR;
	get ssr() {
		return this.#ssr;
	}

	readonly #attributes: WidgetGlobalAttributes;

	readonly #styles: StylesManager;
	get styles() {
		return this.#styles;
	}

	// To identify where the widget is in the widgets tree
	#wnode: NodeWidget;
	get wnode() {
		return this.#wnode;
	}

	get wparent(): BeyondWidget {
		return this.#wnode.parent;
	}

	get wchildren(): BeyondWidget[] {
		return [...this.#wnode.children];
	}

	/**
	 * Actually required by routing to call the .show & .hide methods once the controller is initialised
	 */
	#oncontroller = () => {
		const event = new CustomEvent('controller.initialised', { bubbles: false, composed: false });
		this.dispatchEvent(event);
	};

	constructor(specs: IWidgetSpecs) {
		super();
		this.#specs = specs;

		this.attachShadow({ mode: 'open' });

		/**
		 * Extract the version to the vspecifier
		 * @type {string}
		 */
		this.#specifier = (() => {
			const split = specs.vspecifier.split('/');
			const scope = split[0].startsWith('@') ? split.shift() : void 0;
			const [name] = split.shift().split('@');

			const subpath = split.join('/');
			return (scope ? `${scope}/${name}` : name) + (subpath ? `/${subpath}` : '');
		})();

		this.#attributes = new WidgetGlobalAttributes();
		this.#sr = new WidgetSR(this);
		this.#ssr = new WidgetSSR(this);
		this.#csr = new WidgetCSR(this);
		this.#csr?.on('controller.initialised', this.#oncontroller);
		this.#styles = new StylesManager(this);
	}

	#connected = false;

	/**
	 * The first connection registers the instance and creates the holder; a later connection, after the
	 * element was removed and inserted again, mounts the same controller again in the same holder
	 */
	connectedCallback() {
		if (this.#connected) return void this.#csr.reconnect();
		this.#connected = true;

		// Register the widget in the instances registry after connectedCallback is done
		this.#wnode = instances.register(this);

		this.#holder = document.createElement('span');
		this.#holder.style.display = 'none';
		this.shadowRoot.append(this.#holder);

		this.#attributes.initialise(this.#holder);
		this.#initialise().catch((exc: Error) => console.error(exc.stack));
	}

	/**
	 * Server and static rendering complete, or fail, before the client controller mounts: what they put in
	 * the holder is what the controller hydrates. Their absence, or their failure, leaves an empty holder
	 * and the controller renders from nothing.
	 */
	async #initialise() {
		await this.#ssr.initialise().catch((exc: Error) => console.error(exc.stack));
		await this.#sr.initialise().catch((exc: Error) => console.error(exc.stack));
		this.#csr.initialise();
	}

	disconnectedCallback() {
		this.#csr.disconnect();
	}

	attributeChangedCallback(name: string, old: string, value: string) {
		this.#csr.attributeChanged(name, old, value);
	}
}
