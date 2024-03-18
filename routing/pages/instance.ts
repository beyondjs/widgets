import type { URI } from '@beyond-js/kernel/routing';
import type { Route } from './route';
import { widgets, IWidgetSpecs } from '@beyond-js/widgets/render';
import { PageURI } from './uri';

export interface IParents {
	error?: string;
	value?: IWidgetSpecs[];
}

let id = 0;

export /*bundle*/
class PageInstance {
	readonly #uri: PageURI;
	get uri() {
		return this.#uri;
	}

	get route() {
		return this.#uri.route;
	}

	get element() {
		return this.#uri.route.page;
	}

	get is(): string {
		return 'page';
	}

	readonly #id: number;
	get id(): string {
		return `${this.element}:${this.#id}`;
	}

	constructor(uri: URI, route: Route) {
		this.#uri = new PageURI({ uri, route });
		this.#id = ++id;
	}

	/**
	 * Returns the ascending layouts
	 *
	 * @return {{error?: string, parents?: IWidgetSpecs[]}}
	 */
	get parents(): IParents {
		// Ascending list of containers layouts of the current page
		const value: IWidgetSpecs[] = [];
		let { layout } = widgets.get(this.element);
		while (layout) {
			const found = [...widgets.values()].find(({ name }) => name === layout);
			if (!found) {
				const error = `Layout "${layout}" not found`;
				return { error };
			}

			value.unshift(found);
			layout = found.layout;
		}

		return { value };
	}
}
