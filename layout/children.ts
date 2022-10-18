import type {manager as m, Layout, PageInstance} from '@beyond-js/widgets/routing';
import {widgets, BeyondWidget} from '@beyond-js/widgets/render';
import {ssr} from './ssr';

declare const bimport: (resource: string, version?: number) => Promise<any>;

let manager: typeof m;

customElements.define('beyond-layout-children', class extends HTMLElement {
    #layout: Layout;
    #active: BeyondWidget;

    connectedCallback() {
        this.attachShadow({mode: 'open'});

        const managed = () => {
            const start = () => this.#start().catch(exc => console.error(exc.stack));
            manager.initialised ? start() : manager.ready.then(start);
        }

        // If the manager is already loaded, render without ssr
        if (manager) return managed();

        // While the manager is not loaded, try to render from ssr
        ssr.page ? this.#onssr() : ssr.addEventListener('received', this.#onssr);

        const promises: Promise<any>[] = [];
        promises.push(bimport('@beyond-js/widgets/routing'));
        promises.push(bimport('@beyond-js/kernel/core'));

        const {specifier} = (<any>globalThis).__app_package;
        promises.push(bimport(`${specifier}/start`));

        Promise.all(promises).then(([routing]) => {
            ({manager} = routing);
            managed();
        }).catch(exc => console.log(exc.stack));
    }

    /**
     * The widget container of the current beyond-layout-children container is null if an error is detected,
     * and the DOM document when there is no project layout configured in the project.json
     *
     * @return {{container?: string, error?: string}}
     * @private
     */
    #container: BeyondWidget | typeof document;
    get container() {
        if (this.#container !== void 0) return this.#container;

        const container: BeyondWidget | Document = (() => {
            let parent: Node = this;
            while (true) {
                const root: Node = parent.getRootNode();
                if (root === document) return <Document>root;

                parent = (<ShadowRoot>root).host;
                if (widgets.instances.has(<BeyondWidget>parent)) return <BeyondWidget>parent;
            }
        })();

        if (!container) {
            console.error(`Widget container of beyond-layout-children not found`);
            return this.#container = null;
        }
        return this.#container = container;
    }

    #onssr = () => {
        ssr.removeEventListener('received', this.#onssr);
        const {container} = this;
        if (container === null) return;

        // The index in the hierarchy that must be appended to the shadowRoot of the beyond-layout-children
        const {element, error} = ((): { element?: string, error?: string } => {
            const {hierarchy} = ssr;

            // container is undefined when there is no project layout, and the beyond-layout-children rootNode
            // is the DOM document
            if (container === document) return {element: hierarchy[0]};

            const {localName} = <BeyondWidget>container;
            const index = hierarchy.indexOf(localName);
            if (index === -1) return {
                error: `Container widget of beyond-layout-children "${localName}" not found in ssr hierarchy`
            };
            if (index === hierarchy.length - 1) return {
                error: `Container widget of beyond-layout-children "${localName}" is the page, not a layout`
            };

            return {element: hierarchy[index + 1]};
        })();
        if (error) {
            console.error(error, this);
            return;
        }

        this.shadowRoot.appendChild(document.createElement(element));
    }

    #render = () => {
        this.#layout.children.forEach((child: Layout | PageInstance) => {
            const {children} = this.shadowRoot;
            let element: BeyondWidget = <BeyondWidget>[...children].find(
                element => element.getAttribute('data-child-id') === child.id);

            // Create the HTMLElement of the child if it was not already created
            if (!element) {
                element = <BeyondWidget>document.createElement(child.element);
                element.setAttribute('data-child-id', child.id);
                this.shadowRoot.append(element);
            }

            // The show and hide methods are defined in the page controller
            const active = this.#layout.active === child;
            const controller: any = element.controller;

            if (active && element !== this.#active) {
                this.#active = element;

                const show = () => {
                    element.removeEventListener('controller.initialised', show);
                    if (element !== this.#active) return;

                    const controller: any = element.controller;
                    if (!controller) {
                        throw new Error(`Controller of element widget "${child.element}" is undefined`);
                    }
                    this.#active === element && controller.show?.();
                }

                controller ? controller.show?.() : element.addEventListener('controller.initialised', show);
            } else if (!element.hidden && !active) {
                controller?.hide?.();
            }

            element.hidden = !active;
        });
    }

    // Check if there are ssr elements that must be hydrated (set the child id)
    #hydrate() {
        const {children} = this.shadowRoot;
        const layout = this.#layout;

        if (!children.length) return;
        if (children.length > 1) {
            console.error('Only one child was expected on beyond-layout-children start', this);
            return;
        }
        children[0].setAttribute('data-child-id', [...layout.children.keys()][0]);
    }

    async #start(): Promise<void> {
        ssr.removeEventListener('received', this.#onssr);
        if (this.container === null) return;

        const done = (layout: Layout) => {
            this.#layout = layout;
            this.#hydrate();
            this.#layout.on('change', this.#render);
            this.#render();
        }

        // When there is no layout specified in the project.json, then the container is the DOM document
        if (this.container === document) return done(manager.main);

        // Check if the current beyond-layout-children is the main layout specified in the project.json
        const {localName} = <BeyondWidget>this.container;
        if (localName === manager.main.element) return done(manager.main);

        // Look for the layout
        if (!manager.layouts.has(localName)) {
            console.error(`Layout "${localName}" not found`, [...manager.layouts], manager);
            return;
        }
        done(manager.layouts.get(localName));
    }
});
