import type { LayoutInstance } from './layout';

/**
 * The registry of all layouts instances registered in the session, except the main layout
 */
export default class extends Map<string, LayoutInstance> {
	register(layout: LayoutInstance) {
		this.set(layout.id, layout);
	}
}
