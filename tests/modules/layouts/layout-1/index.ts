import { HTMLController } from '@beyond-js/widgets-tests/html-controller';

export /*bundle*/ class Controller extends HTMLController {
	html(props: Record<string, any>) {
		return `<div class="page">
			<div>Layout #1</div>
			<div><beyond-layout-children/></div>
		</div>`;
	}
}
