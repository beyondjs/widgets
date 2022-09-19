import {Events} from '@beyond-js/kernel/core';

export /*bundle*/
class WidgetAttributes extends Map {
    // The reason why it is declared as HTMLElement is to avoid circular reference between controller and widget.
    #widget: HTMLElement;

    #events = new Events();
    on = (event: string, listener: any) => this.#events.on(event, listener);
    off = (event: string, listener: any) => this.#events.off(event, listener);

    constructor(widget: HTMLElement) {
        super();
        this.#widget = widget;

        let attrs: string[] = (<any>widget).specs.attrs;
        attrs?.forEach(attr => this.set(attr, widget.getAttribute(attr)));
    }

    change(name: string, old: string, value: string) {
        this.set(name, value);
        this.#events.trigger('change');
        this.#events.trigger(`${name}:change`, value);
    }
}
