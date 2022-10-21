export /*bundle*/
interface IWidgetSpecs {
    name: string
    vspecifier: string,
    attrs?: string[],
    is?: string,
    layout?: string,
    route?: string,
    render: {
        multilanguage?: boolean,
        ssr: boolean,
        csr: boolean,
        sr: boolean
    }
}

export /*bundle*/ type StylesManager = any;

export /*bundle*/ type BeyondWidget = HTMLElement;

export /*bundle*/
const widgets = new class BeyondWidgets extends Map<string, IWidgetSpecs> {
    constructor() {
        super();
    }

    register(specs: IWidgetSpecs[]) {
        specs.forEach((specs) => {
            // Widgets can be registered at application start, and later by the widget bundle
            if (this.has(specs.name)) return;

            specs.render = specs.render ? specs.render : {csr: true, ssr: false, sr: false};
            const {name, render} = specs;
            render.csr = typeof render.csr === 'boolean' ? render.csr : true;

            this.set(name, specs);
        });
    }
}
