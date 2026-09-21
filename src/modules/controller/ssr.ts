import { WidgetControllerBase } from './controller';
import { DependenciesStyles } from '@beyond-js/kernel/styles';
import type { IWidgetSpecs } from '@beyond-js/widgets/render';

export /*bundle*/
interface IWidgetRendered {
	html?: string;
	css?: string;
	errors?: string[];
	warnings?: string[];
	store?: object;
	attributes?: [string, string][];
}

/**
 * The server side implementation of the widget controller
 */
export /*bundle*/
abstract class WidgetServerController extends WidgetControllerBase {
	readonly #styles: string[] = [];
	get styles() {
		return this.#styles;
	}

	protected constructor(params: { specs?: IWidgetSpecs; widget?: HTMLElement }) {
		super(params);
		const styles = new DependenciesStyles(this.specs.vspecifier);
		styles.elements.forEach(({ href }: { href: string }) => this.#styles.push(href));
		styles.destroy?.();

		// The shared stylesheet of the package, named by a placeholder the client resolves from the package
		this.specs.global && this.#styles.unshift(`##_!${this.pkg}!_##global`);
	}

	abstract render(props: Record<string, any>): Promise<IWidgetRendered> | IWidgetRendered;
}
