export default class extends Map<string, any> {
    update(deps?: [string, any][]) {
        this.clear();
        deps?.forEach(([specifier, dependency]) => this.set(specifier, dependency));
    }
}
