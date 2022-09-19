import {widgets} from '@beyond-js/widgets/render';
import {routing} from '@beyond-js/kernel/routing';

export /*bundle*/
class Route {
    readonly #pathname: string;
    get pathname() {
        return this.#pathname;
    }

    #page: string;
    get page() {
        return this.#page;
    }

    #vars: Map<string, string>;
    get vars() {
        return this.#vars;
    }

    constructor(pathname: string) {
        this.#pathname = pathname;
    }

    async process(): Promise<void> {
        const pathname = this.#pathname.split('/');

        // Split the routes of each page to make it easier to find the route that applies to the pathname
        // being requested
        const registered: Map<string, string[]> = new Map();
        widgets.forEach(({is, name, route}) => is === 'page' && registered.set(name, route.split('/')));

        // The pages whose routes apply by the length of their urls
        const target = [...registered].filter(([, route]) => route.length === pathname.length);

        this.#vars = new Map();
        const found = target.find(([, route]) => {
            this.#vars.clear();
            for (let i = 0; i < pathname.length; i++) {
                const dir = route[i];

                // Check if it is a route var (ex: /article/${id})
                if (dir.startsWith('${') && dir.endsWith('}')) {
                    const vname = dir.slice(2, dir.length - 1);
                    this.#vars.set(vname, pathname[i]);
                    continue;
                }

                if (dir !== pathname[i]) return false;
            }
            return true;
        });

        this.#page = found ? found[0] : await routing.missing?.(this.#pathname);
    }
}
