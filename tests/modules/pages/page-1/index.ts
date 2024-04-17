import { HTMLController } from '@beyond-js/widgets-tests/html-controller';

export /*bundle*/ class Controller extends HTMLController {

	get Widget() {
		
	}
	html(props: Record<string, any>) {
		return `<div class="page">Page #1</div>`;
	}

	addListeners() {}
}
