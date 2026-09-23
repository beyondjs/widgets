import type { BeyondWidget } from '../index';
import { Events } from '@beyond-js/kernel/core';
import { styles as registry } from '@beyond-js/kernel/styles';

/**
 * What the runtime registers for a stylesheet: its current address, and `change` when it is replaced
 */
interface IRegistered {
	href: string;
	on(event: 'change', listener: () => void): void;
	off(event: 'change', listener: () => void): void;
}

/**
 * The shared stylesheet of the package of a widget: its `global` style module, adopted inside the root of
 * every widget of the package before the sheets of the widget itself.
 *
 * It is addressed from the package of the widget, as the module of the widget was loaded, so the same
 * widget adopts the same shared sheet in an application built with Beyond and in a page that embeds it
 * from another origin. A package that publishes no `global` stylesheet has no link, and nothing is
 * requested for it.
 *
 * The address is registered in the stylesheet registry of the runtime under the module it belongs to
 * (`<package>@<version>/global`), once for every widget of the package: a development update of the shared
 * sheet replaces it there, and every root that adopted it links the new version. A runtime without that
 * registry keeps a version of its own, which `update()` increments.
 */
export /*bundle*/
class GlobalCSS extends Events {
	readonly #widget: BeyondWidget;
	#version = 0;
	#registered?: IRegistered;
	#change = () => this.trigger('change');

	constructor(widget: BeyondWidget) {
		super();
		this.#widget = widget;
	}

	/**
	 * The address to link, or undefined when the package publishes no shared stylesheet
	 */
	get link(): string | undefined {
		const { host, query, specs } = this.#widget;
		if (!specs.global || !host) return;

		const address = `${host}/styles/global${query}`;
		const link = (<{ link?: (href: string) => IRegistered }>(<unknown>registry))?.link;
		if (!this.#registered && typeof link === 'function') {
			this.#registered = link.call(registry, address);
			this.#registered.on('change', this.#change);
		}
		if (this.#registered) return this.#registered.href;
		return `${address}${this.#version ? `#v=${this.#version}` : ''}`;
	}

	update() {
		this.#version++;
		this.trigger('change');
	}

	/**
	 * Releases the subscription to the registered stylesheet
	 */
	destroy() {
		this.#registered?.off('change', this.#change);
		this.#registered = void 0;
	}
}
