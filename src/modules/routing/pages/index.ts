import type { BeyondWidget } from '@beyond-js/widgets/render';
import type { URI } from '@beyond-js/kernel/routing';
import type { Route } from './route';
import type { manager } from '../manager';
import { PageInstance } from './instance';

declare function require(module: string): any;

type pathname = string;

export default class extends Map<pathname, PageInstance> {
	// @deprecated: Use .obtain instead of this method
	instance(id: string): PageInstance {
		return [...this.values()].find(instance => instance.id === id);
	}

	obtain({ widget, id }: { widget?: BeyondWidget; id?: string }): PageInstance {
		if (id) return this.instance(id);

		const child = widget.getAttribute('data-child-id');
		return this.instance(child);
	}

	register(uri: URI, route: Route): PageInstance {
		const { pathname } = uri;

		const instance: PageInstance = (() => {
			if (!this.has(pathname)) return new PageInstance(uri, route);

			const instance = this.get(pathname);
			instance.uri.update(uri);
			return instance;
		})();

		this.set(pathname, instance);

		return instance;
	}
}
