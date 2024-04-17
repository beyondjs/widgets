import LegacyStyles from "./legacy";
import {V1Styles} from "./v1";

class Registry {
    #registry: Map<string, LegacyStyles | V1Styles> = new Map();

    register(vspecifier: string, value: string) {
        if (this.#registry.has(vspecifier)) return;
        const styles = value ? new LegacyStyles(vspecifier, value) : new V1Styles(vspecifier);
        this.#registry.set(vspecifier, styles);
        return styles;
    }

    has(vspecifier: string) {
        return this.#registry.has(vspecifier);
    }

    get(vspecifier: string) {
        return this.#registry.get(vspecifier);
    }
}

export /*bundle*/ const styles = new Registry();

// Just for legacy projects
(globalThis as any).beyondLegacyStyles = styles;
