import type {IWidgetRendered} from "../widget/renderer";

export /*bundle*/
const prerender = new class {
    readonly #ssr: IWidgetRendered[] = [];
    get ssr() {
        return this.#ssr;
    }

    find(element: string, attrs: Map<string, string>): IWidgetRendered {
        return this.#ssr.find(item => {
            if (item.element !== element) return false;
            const iattrs = new Map(item.attributes);
            return [...attrs].reduce((prev, [name, value]) => prev || iattrs.get(name) === value, true);
        });
    }
}
