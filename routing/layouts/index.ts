import type {Layout} from "./layout";

/**
 * The registry of all layouts instances registered in the session, except the main layout
 */
export default class extends Map<string, Layout> {
    register(layout: Layout) {
        this.set(layout.id, layout);
    }
}
