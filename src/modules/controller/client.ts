import { WidgetControllerBase, IWidgetStore } from './controller';
import { WidgetAttributes } from './attributes';
import { instances as bundles } from '@beyond-js/kernel/bundle';
import type { StylesManager } from '@beyond-js/widgets/render';
import { DependenciesStyles } from '@beyond-js/kernel/styles';

/**
 * The client implementation of the widget controller.
 *
 * It owns what a mounted widget subscribes to: the stylesheets of its module and of the public modules
 * its package depends on, adopted in its root through the styles manager of the element, and the updates
 * of its module, which refresh the mounted view. Both subscriptions are released when the element is
 * disconnected and taken again when it is connected again, so an element that is removed and inserted
 * refreshes once per change and leaves nothing behind when it goes.
 */
export /*bundle*/
abstract class WidgetClientController extends WidgetControllerBase {
	/**
	 * The beyond widget.
	 * The reason why it is declared as HTMLElement is to avoid circular reference between controller and widget.
	 *
	 * @type {HTMLElement} The beyond widget
	 * @private
	 */
	readonly #widget: HTMLElement;
	get widget() {
		return this.#widget;
	}

	#store: IWidgetStore;
	get store(): IWidgetStore {
		return this.#store;
	}

	readonly #attributes: WidgetAttributes;
	get attributes() {
		return this.#attributes;
	}

	attributeChanged(name: string, old: string, value: string) {
		this.#attributes.change(name, old, value);
	}

	get styles() {
		const styles: StylesManager = (<any>this.#widget).styles;
		return styles;
	}

	/**
	 * The stylesheets the module of the widget and its non-widget dependencies register
	 */
	readonly #dependencies: DependenciesStyles;

	#links = () => [...this.#dependencies.elements].map(style => style.href);
	#onstyles = () => this.styles.update(this.#links());

	protected constructor(widget: HTMLElement) {
		super({ widget });
		this.#widget = widget;
		this.#attributes = new WidgetAttributes(widget);

		this.#dependencies = new DependenciesStyles(this.specs.vspecifier);
		!this.styles.initialised && this.styles.initialise(this.#links());
		this.#dependencies.on('change', this.#onstyles);
	}

	abstract mount(props?: Record<string, any>): void;

	abstract unmount(): void;

	render() {
		try {
			this.mount();
		} catch (exc) {
			console.log(`Error mounting widget controller "${this.#widget.localName}":`);
			console.log(exc.stack);
		}
	}

	refresh() {
		this.unmount();
		this.render();
	}

	#refresh = () => this.refresh();

	/**
	 * The runtime package of the module of the widget, whose updates refresh the view
	 */
	get #package() {
		return bundles.get(this.specs.vspecifier)?.package();
	}

	#subscribed = false;

	#subscribe() {
		if (this.#subscribed) return;
		this.#subscribed = true;
		this.#dependencies.on('change', this.#onstyles);
		this.#package?.hmr.on('change', this.#refresh);
	}

	#unsubscribe() {
		if (!this.#subscribed) return;
		this.#subscribed = false;
		this.#dependencies.off('change', this.#onstyles);
		this.#package?.hmr.off('change', this.#refresh);
	}

	/**
	 * Comes from the web component disconnectedCallback method call: the view is unmounted and nothing of
	 * this controller listens any more
	 */
	disconnect() {
		this.#unsubscribe();
		this.unmount();
	}

	/**
	 * Comes from the web component connectedCallback of an element that was disconnected: the view is
	 * mounted again in the same holder, with the same store and attributes
	 */
	reconnect() {
		this.#subscribe();
		this.render();
	}

	/**
	 * Releases everything the controller holds. It is not called by the element, which may be connected
	 * again; a host that discards a widget for good calls it.
	 */
	dispose() {
		this.#unsubscribe();
		this.#dependencies.off('change', this.#onstyles);
		this.#dependencies.destroy?.();
		this.styles.destroy();
	}

	async initialise() {
		this.#store = this.createStore?.();

		// Type check in widget is disabled due to the cyclical reference between controller and widget
		const prerender: any = (<any>this.#widget).ssr.prerender;
		if (prerender) {
			const cached = prerender?.store;
			cached && (await this.#store?.hydrate?.(cached));
		}

		this.#store?.fetch?.();

		this.render();

		// Attach to hmr changes of bundle of the widget controller
		if (!bundles.has(this.specs.vspecifier)) {
			console.log(
				`Bundle id "${this.specs.vspecifier}" not found. Try refreshing the page.\n` +
					`If the problem still persist, delete the BeyondJS cache and try again.`
			);
			return;
		}
		this.#subscribe();
	}
}
