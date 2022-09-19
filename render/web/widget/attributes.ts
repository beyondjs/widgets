import {attributes} from '../attributes';

/**
 * The global attributes specified in widgets.attributes that apply to all the widgets in the application
 */
export class WidgetGlobalAttributes {
    #holder: HTMLSpanElement;
    get holder() {
        return this.#holder;
    }

    #set = (name: string, value: string) => {
        this.#holder.setAttribute(name, value);
    }

    #remove = (name: string) => {
        this.#holder.removeAttribute(name);
    }

    initialise(holder: HTMLSpanElement) {
        this.#holder = holder;

        attributes.values.forEach((value, name) => this.#set(name, value));
        attributes.on('add', this.#set);
        attributes.on('remove', this.#remove);
    }

    destroy() {
        attributes.off('add', this.#set);
        attributes.off('remove', this.#remove);
    }
}
