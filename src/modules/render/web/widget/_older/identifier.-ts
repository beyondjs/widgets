import {BeyondWidget} from "./index";

/**
 * The widget identifier relies on its initial attributes to uniquely identify it
 * in ssr and static generated environments.
 *
 */
export class WidgetIdentifier {
    readonly #widget: BeyondWidget;

    readonly #initial: string;
    get initial() {
        return this.#initial;
    }

    constructor(widget: BeyondWidget) {
        this.#widget = widget;
    }
}
