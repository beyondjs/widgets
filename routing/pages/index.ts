import {PageInstance} from "./instance";
import type {URI} from '@beyond-js/kernel/routing';
import type {Route} from '../route';

type pathname = string;

export default class extends Map<pathname, PageInstance> {
    instance(id: string) {
        return [...this.values()].find(instance => instance.id === id);
    }

    register(uri: URI, route: Route): PageInstance {
        const {pathname} = uri;

        let instance: PageInstance = this.has(pathname) ? this.get(pathname) : undefined;
        instance = instance ? instance : new PageInstance(uri, route);
        this.set(pathname, instance);

        return instance;
    }
}
