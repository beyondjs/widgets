import {WidgetControllerBase, IWidgetStore} from './controller';
import {WidgetAttributes} from './attributes';
import {instances as bundles} from '@beyond-js/kernel/bundle';
import type {StylesManager} from '@beyond-js/widgets/render';
import {DependenciesStyles} from '@beyond-js/kernel/styles';

/**
 * The client widget react controller
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

    protected constructor(widget: HTMLElement) {
        super({widget});
        this.#widget = widget;
        this.#attributes = new WidgetAttributes(widget);

        const styles = new DependenciesStyles(this.specs.vspecifier);
        const links = () => [...styles.elements].map(style => style.href);

        !this.styles.initialised && this.styles.initialise(links());
        styles.on('change', () => this.styles.update(links()));
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
     * Comes from the web component disconnectedCallback method call
     */
    disconnect() {
        this.unmount();
    }

    async initialise() {
        if (!this.Widget) {
            throw new Error(`The return value of the Widget property is undefined. "${this.#widget.localName}" widget`);
        }

        this.#store = this.createStore?.();

        // Type check in widget is disabled due to the cyclical reference between controller and widget
        const prerender: any = (<any>this.#widget).ssr.prerender;
        if (prerender) {
            const cached = prerender?.store;
            await this.#store?.hydrate(cached);
        }

        this.#store?.fetch?.();

        this.render();

        // Attach to hmr changes of bundle of the widget controller
        if (!bundles.has(this.specs.vspecifier)) {
            console.log(`Bundle id "${this.specs.vspecifier}" not found. Try refreshing the page.\n` +
                `If the problem still persist, delete the BeyondJS cache and try again.`);
            return;
        }
        const pkg = bundles.get(this.specs.vspecifier).package();
        pkg.hmr.on('change', this.#refresh);
    }
}
