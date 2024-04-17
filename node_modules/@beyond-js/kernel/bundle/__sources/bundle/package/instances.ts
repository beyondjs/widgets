import type {Package} from "./index";

export default new class extends Map {
    register(pkg: Package) {
        this.set(pkg.vspecifier, pkg);
    }
}
