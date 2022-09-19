interface PageSSR {
    element: string,
    parents: string[]
}

export /*bundle*/ const ssr = new class extends EventTarget {
    // The main layout
    #main: string;
    get main() {
        return this.#main;
    }

    // The widget name of the page
    #page: string;
    get page() {
        return this.#page;
    }

    // The parent widgets of the page
    #layouts: string[];
    get layouts() {
        return this.#layouts;
    }

    // The hierarchy of layouts and page considering the main layout, the parent widgets of the page
    // and the page itself
    #hierarchy: string[] = [];
    get hierarchy() {
        return this.#hierarchy;
    }

    data(main: string, page: PageSSR) {
        this.#main = main;
        this.#page = page.element;
        this.#layouts = page.parents;

        main && this.#hierarchy.push(main);
        page.parents && (this.#hierarchy = this.#hierarchy.concat(page.parents));
        this.#hierarchy.push(page.element);

        const event = new Event('received');
        this.dispatchEvent(event);
    }
}
