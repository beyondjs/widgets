import { WidgetServerController, IWidgetRendered } from '@beyond-js/widgets/controller';

export abstract class HTMLController extends WidgetServerController {
	render(props: Record<string, any>): IWidgetRendered {
		const html = this.html(props);
		return { html };
	}

	abstract html(props: Record<string, any>): string;
}
