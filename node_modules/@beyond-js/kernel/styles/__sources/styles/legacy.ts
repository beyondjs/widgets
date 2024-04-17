export default class {
    get engine() {
        return 'legacy';
    }

    readonly #bundle: string;

    readonly #value: string;
    get value() {
        return this.#value;
    }

    // Is the stylesheet appended to the DOM of the page (not a shadow dom of a widget)
    #appended = false;
    get appended() {
        return this.#appended;
    }

    constructor(bundle: string, value: string) {
        this.#bundle = bundle;

        const module = (() => {
            const module = bundle.split('/');
            module.pop();
            return module.join('/');
        })();

        // Find and replace #host...
        const regexp = /#host\.([\w\d]*)#([^.]*\.[\w\d]*)/g;
        this.#value = value.replace(regexp, (match, host, resource) => {
            if (host === 'module' || host === 'library') {
                return `${module}/${resource}`;
            } else if (host === 'application') {
                return resource;
            }
            console.warn(`Invalid css host specification on bundle "${bundle}"`, match);
        });
    }

    /**
     * @deprecated Only required by legacy applications
     */
    appendToDOM(is: string) {
        if (this.#appended) {
            const previous = document.querySelectorAll(`:scope > [bundle="${this.#bundle}"]`)[0];
            previous && document.removeChild(previous);
        }

        const css = document.createElement('style');
        css.appendChild(document.createTextNode(this.#value));

        is && css.setAttribute('is', is);
        document.getElementsByTagName('head')[0].appendChild(css);

        this.#appended = true;
    }
}
