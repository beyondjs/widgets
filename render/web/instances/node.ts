import type {BeyondWidget} from "../widget";

export /*bundle*/
class NodeWidget {
    readonly #widget: BeyondWidget;
    get widget() {
        return this.#widget;
    }

    readonly #parent: BeyondWidget;
    get parent() {
        return this.#parent;
    }

    readonly #children: Set<BeyondWidget> = new Set();
    get children() {
        return this.#children;
    }

    constructor(widget: BeyondWidget, parent?: BeyondWidget) {
        this.#widget = widget;
        this.#parent = parent;
    }
}
