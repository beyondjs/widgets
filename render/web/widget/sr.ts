import {BeyondWidget} from './index';
import checksum from './checksum';
import {IWidgetRendered, Renderer} from './renderer';

export class WidgetSR {
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

    async initialise(): Promise<void> {
        if (this.#initialised) throw new Error('Widget SSR already initialised');
        this.#initialised = true;

        const {specs} = this.#widget;

        // Check if SR is enabled for this widget
        if (!specs.render.sr) return;

        const language = (() => {
            const {multilanguage} = specs.render;
            if (!multilanguage) return '';

            let language = localStorage.__beyond_language;
            language = language ? language : navigator.language;
            language = language.slice(0, 2);
            return `${language}:`;
        })();

        let resource;
        if (specs.is === 'page') {
            let key = `${language}${specs.name}//${location.pathname}${location.search}`;
            resource = checksum(key);
        } else if (specs.is === 'layout') {
            resource = checksum(`${language}${specs.name}`);
        } else {
            const compute = new Map();
            specs.attrs?.forEach(attr => {
                const value = this.#widget.getAttribute(attr);
                value && compute.set(attr, value);
            });

            let key = language;
            [...compute]
                .sort((a, b) => a[0] < b[0] ? 1 : 0)
                .forEach(([k, v]) => key += `${k}//${v}///`);
            resource = checksum(key);
        }

        const host = await this.#widget.host;
        const url = `${host}__sr_widgets__/${specs.name}.${resource}.js`;

        try {
            const response = await fetch(url);
            if (response.status !== 200) {
                console.error(`Error fetching static rendered widget "${specs.name}". Status code: ${response.status}`);
                return;
            }
            const sr: IWidgetRendered = await response.json();

            // Register as a pre-rendered widget (required to hydrate the store)
            this.#prerender = sr;

            // Finally render the widget
            await this.#renderer.render(sr);
        } catch (exc) {
            console.error('Widget static content fetch error:', exc.message);
        }
    }
}
