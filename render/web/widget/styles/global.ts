import type {BeyondWidget} from "../index";
import {Events} from '@beyond-js/kernel/core';

export /*bundle*/
class GlobalCSS extends Events {
    readonly #widget: BeyondWidget;
    #version = 0;

    constructor(widget: BeyondWidget) {
        super();
        this.#widget = widget;

        const {host} = this.#widget;
        const version = this.#version !== 0 ? `?version=${this.#version}` : '';
        this.#link = `${host}global.css${version}`;
    }

    readonly #link: string;
    get link(): string {
        return this.#link;
    }

    update() {
        this.#version++;
        this.trigger('change');
    }
}
