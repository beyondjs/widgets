export default class {
    readonly #href: string;
    get href() {
        return this.#href;
    }

    readonly #resource: string;
    get resource() {
        return this.#resource;
    }

    readonly #version: number;
    get version() {
        return this.#version;
    }

    constructor(href: string) {
        this.#href = href;

        const iv = href.split('?version=');
        this.#resource = iv[0];
        this.#version = iv[1] ? parseInt(iv[1]) : 0;
    }
}