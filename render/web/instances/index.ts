import type {BeyondWidget} from "../widget";
import {NodeWidget} from "./node";

// Maintains a tree of widget instances
// NodeWidget is an object with a tree structure (parent, children)
export const instances = new class extends Set<BeyondWidget> {
    register(widget: BeyondWidget): NodeWidget {
        this.add(widget);

        // Find parent widget
        const parent: BeyondWidget = ((): BeyondWidget => {
            let parent: Node = widget;
            while (true) {
                const root: Node = parent.getRootNode();
                if (root === document) return;

                parent = (<ShadowRoot>root).host;
                if (this.has(<BeyondWidget>parent)) return <BeyondWidget>parent;
            }
        })();

        const node = new NodeWidget(widget, parent);
        parent?.wnode.children.add(widget);

        this.add(widget);
        return node;
    }
}
