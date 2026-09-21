/**
 * One stylesheet link of a widget: its address, the resource it is a version of, and its version.
 *
 * A stylesheet is replaced by linking a new address of the same resource. The development delivery
 * addresses a replacement by the hash of the new sheet (`/u/<hash>/…/styles/<subpath>`) and the runtime
 * appends `#v=<version>` to tell the versions apart; the legacy delivery appended `?version=<n>`. Both
 * spellings identify the same resource as the address they replace.
 */
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

		const [location, fragment = ''] = href.split('#');
		const versioned = /(?:^|&)v=(\d+)$/.exec(fragment);
		const legacy = /[?&]version=(\d+)/.exec(location);
		this.#version = versioned ? parseInt(versioned[1]) : legacy ? parseInt(legacy[1]) : 0;

		this.#resource = location
			.replace(/[?&]version=\d+/, '')
			.replace(/\/u\/[0-9a-f]{32}\//, '/m/');
	}
}
