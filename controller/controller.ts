import {IWidgetSpecs, widgets} from '@beyond-js/widgets/render';

export /*bundle*/
interface IWidgetStore {
    toJSON(): object;

    hydrate?(cached: object): Promise<void> | void;

    fetch(): Promise<void>;
}

export /*bundle*/
abstract class WidgetControllerBase {
    readonly #specs: IWidgetSpecs;
    get specs() {
        return this.#specs;
    }

    get element(): string {
        return this.#specs.name;
    }

    get is(): string {
        return this.#specs.is;
    }

    get route(): string {
        return this.#specs.route;
    }

    get layout(): string {
        return this.#specs.layout;
    }

    readonly #pkg: string;
    get pkg() {
        return this.#pkg;
    }

    // The widget component to be mounted should be specified by the module
    // (can be a React, Svelte, Vue, ... component)
    get Widget(): any {
        return;
    }

    createStore(language?: string): IWidgetStore {
        return void (language);
    }

    /**
     * Controller base constructor
     *
     * @param {} specs
     * @param {HTMLElement} widget
     * The reason why it is declared as HTMLElement is to avoid circular reference between controller and widget.
     * @protected
     */
    protected constructor({specs, widget}: { specs?: IWidgetSpecs, widget?: HTMLElement }) {
        if (!specs) {
            const {localName} = widget;
            if (!widgets.has(localName)) throw new Error(`Widget name "${localName}" is not registered`);
            specs = widgets.get(localName);
        }

        this.#pkg = (() => {
            const split = specs.vspecifier.split('/');
            const scope = split[0].startsWith('@') ? split.shift() : void 0;
            const [name] = split.shift().split('@');
            return scope ? `${scope}/${name}` : name;
        })();

        this.#specs = specs;
    }
}
