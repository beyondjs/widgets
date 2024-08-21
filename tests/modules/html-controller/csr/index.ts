import { WidgetClientController } from '@beyond-js/widgets/controller';
import type { BeyondWidget } from '@beyond-js/widgets/render';

export /*bundle*/ abstract class HTMLController extends WidgetClientController {
	get widget(): BeyondWidget {
		return <BeyondWidget>super.widget;
	}

	// Declare properties and lifecycle methods for the widget
	mount(props?: Record<string, any>) {
		const holder: HTMLSpanElement = (<any>this.widget).holder;
		holder.innerHTML = this.html(props);
		holder.style.display = '';
		this.addListeners?.();
	}

	unmount() {
		this.removeListeners?.();
	}

	abstract html(props: Record<string, any>): string;

	abstract addListeners(): void;
	abstract removeListeners(): void;
}
