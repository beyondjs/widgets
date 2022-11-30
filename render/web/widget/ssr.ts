import {BeyondWidget} from "./index";
import {prerender} from "../prerendered";
import {IWidgetRendered, Renderer} from "./renderer";

declare const bimport: (resource: string, version?: number) => Promise<any>;

export class WidgetSSR {
    readonly #widget: BeyondWidget;
    readonly #renderer: Renderer;

    #prerender: IWidgetRendered;
    get prerender() {
        return this.#prerender;
    }

    constructor(widget: BeyondWidget) {
        this.#widget = widget;
        this.#renderer = new Renderer(widget);
    }

    #initialised = false;

    /**
     * Check if widget is already pre-rendered (index.html makes a page ssr fetch)
     */
    async initialise() {
        // Check if SSR is enabled for this widget
        if (!this.#widget.specs.render.ssr) return;

        if (this.#initialised) throw new Error('Widget SSR already initialised');
        this.#initialised = true;

        const widget = this.#widget;
        const {specs} = widget;
        const attrs = new Map(specs.attrs ? specs.attrs.map(attr => [attr, widget.getAttribute(attr)]) : void 0);
        const found = prerender.find(specs.name, attrs);

        // If the widget has not been loaded by routing SSR, then load the widget alone
        if (!found) {
            return await this.#load();
        }
        this.#prerender = found;

        // Finally render the widget
        await this.#renderer.render(found);
    }

    async #load(): Promise<void> {
        const {specifier, name} = this.#widget;

        const host = await (async () => {
            const split = specifier.split('/');
            const pkg = split[0].startsWith('@') ? `${split.shift()}/${split.shift()}` : split.shift();
            const {ssr: config} = (await bimport(`${pkg}/config`)).default;
            if (!config || !config.host) {
                console.error(`Project "${pkg}" does not support SSR (host not configured). ` +
                    `Required by "${name}" widget.`);
                return;
            }

            return config.host;
        })();
        if (!host) return;

        const language = (() => {
            const {specs} = this.#widget;
            const {multilanguage} = specs.render;
            if (!multilanguage) return '';

            let language = localStorage.__beyond_language;
            language = language ? language : navigator.language;
            language = language.slice(0, 2);
            return `&language=${language}`;
        })();

        let attrs = (() => {
            const {specs} = this.#widget;
            if (!specs.attrs?.length) return '';

            let attrs = '&attrs=' + specs.attrs.join(',');
            specs.attrs.forEach(attr => {
                const value = this.#widget.getAttribute(attr);
                if (!value) return;
                attrs += `&attr.${attr}=${value}`
            });
        })();

        const url = `${host}/widget?name=${name}${language}${attrs}`

        try {
            const response = await fetch(url);
            if (response.status !== 200) {
                console.error(`Error fetching SSR of widget "${name}". Status code: ${response.status}`);
                return;
            }
            const sr: IWidgetRendered = await response.json();

            // Register as a pre-rendered widget (required to hydrate the store)
            this.#prerender = sr;

            // Finally render the widget
            await this.#renderer.render(sr);
        } catch (exc) {
            console.error(exc.stack);
        }
    }
}
