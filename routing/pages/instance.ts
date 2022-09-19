import type {URI} from '@beyond-js/kernel/routing';
import type {Route} from "../route";
import {widgets, IWidgetSpecs} from '@beyond-js/widgets/render';

export interface IParents {
    error?: string,
    value?: IWidgetSpecs[]
}

let id = 0;

export /*bundle*/
class PageInstance {
    readonly #uri: URI;
    get uri() {
        return this.#uri;
    }

    readonly #route: Route;
    get route() {
        return this.#route;
    }

    get element() {
        return this.#route.page;
    }

    get is(): string {
        return 'page';
    }

    readonly #id: number;
    get id(): string {
        return `${this.element}:${this.#id}`;
    }

    /**
     * Returns the ascending layouts
     *
     * @return {{error?: string, parents?: IWidgetSpecs[]}}
     */
    get parents(): IParents {
        // Ascending list of containers layouts of the current page
        const value: IWidgetSpecs[] = [];
        let {layout} = widgets.get(this.element);
        while (layout) {
            const found = [...widgets.values()].find(({name}) => name === layout);
            if (!found) {
                const error = `Layout "${layout}" not found`;
                return {error};
            }

            value.unshift(found);
            layout = found.layout;
        }

        return {value};
    }

    constructor(uri: URI, route: Route) {
        this.#uri = uri;
        this.#route = route;
        this.#id = ++id;
    }
}
