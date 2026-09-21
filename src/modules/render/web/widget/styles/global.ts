import type { BeyondWidget } from '../index';
import { Events } from '@beyond-js/kernel/core';

/**
 * The shared stylesheet of the package of a widget: its `global` style module, adopted inside the root of
 * every widget of the package before the sheets of the widget itself.
 *
 * It is addressed from the package of the widget, as the module of the widget was loaded, so the same
 * widget adopts the same shared sheet in an application built with Beyond and in a page that embeds it
 * from another origin. A package that publishes no `global` stylesheet has no link, and nothing is
 * requested for it. A change increments the version, which is part of the address.
 */
export /*bundle*/
class GlobalCSS extends Events {
	readonly #widget: BeyondWidget;
	#version = 0;

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
		const version = this.#version ? `#v=${this.#version}` : '';
		return `${host}/styles/global${query}${version}`;
	}

	update() {
		this.#version++;
		this.trigger('change');
	}
}
