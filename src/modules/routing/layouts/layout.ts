import type Layouts from './';
import type { PageInstance } from '../pages/instance';
import { Events } from '@beyond-js/kernel/core';
import { IWidgetSpecs } from '@beyond-js/widgets/render';

type LayoutChild = LayoutInstance | PageInstance;

export /*bundle*/
class LayoutInstance extends Events {
	get is() {
		return 'layout';
	}

	readonly #layouts: Layouts;

	readonly #element: string;
	get element() {
		return this.#element;
	}

	get id(): string {
		return this.#element;
	}

	// The active child in the layout
	#active: LayoutChild;
	get active() {
		return this.#active;
	}

	// Property #parent is undefined only if it is the main layout
	#parent: LayoutInstance;

	// The layouts and pages that are contained in the current layout
	readonly #children: Map<string, LayoutChild> = new Map();
	get children() {
		return this.#children;
	}

	/**
	 * Layout constructor
	 *
	 * @param {Layouts} layouts The layouts registry
	 * @param {string} element The element name of the widget. Undefined if the project does not set a layout
	 * and the index.html has a <beyond-layout-children/> as its main layout container
	 * @param {Layout} parent The parent layout. Undefined if it is the main layout
	 */
	constructor(layouts: Layouts, element?: string, parent?: LayoutInstance) {
		super();

		this.#layouts = layouts;
		this.#element = element ? element : 'main';
		this.#parent = parent;
	}

	/**
	 * Activates the current page being navigated
	 * Create the layout instance if not previously created
	 *
	 * @param {PageInstance} page The page being navigated
	 */
	activate(page: PageInstance, layouts: IWidgetSpecs[]) {
		// Get the child instance (page or layout)
		// Create the layout instance if not previously created
		const child: LayoutChild = (() => {
			if (!layouts.length) return page;
			const { name: element } = layouts[0];

			const found = <LayoutInstance>[...this.#children.values()].find(child => child.element === element);
			if (found) return found;

			const layout = new LayoutInstance(this.#layouts, element, this);
			this.#layouts.register(layout);
			return layout;
		})();

		this.#children.set(child.id, child);

		// Check if current active child has changed
		const changed = this.#active !== child;

		// Deactivate layout if last active layout is not the current one
		changed && this.#active?.is === 'layout' && (this.#active as LayoutInstance).deactivate();

		// Set the active child
		this.#active = child;

		// Continue iterating the following layouts in the list
		layouts.shift();
		child.is === 'layout' && (child as LayoutInstance).activate(page, layouts);
		changed && this.trigger('change');
	}

	deactivate() {
		const active = this.#active;
		if (!active) {
			console.warn(`Layout "${this.#element}" doesn't have any active child`);
			return;
		}

		this.#active = void 0;
		active.is === 'layout' && (active as LayoutInstance).deactivate();
		this.trigger('change');
	}
}
