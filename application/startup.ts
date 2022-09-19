import type {prerender as p} from '@beyond-js/widgets/render';
import type {ssr as s} from '@beyond-js/widgets/layout';

declare const bimport: (resource: string, version?: number) => Promise<any>;

function createLayout(config: any) {
    const {layout} = config;
    const element = document.createElement(layout ? layout : 'beyond-layout-children');
    document.body.append(element);
}

function startup() {
    const promises: Promise<any>[] = [];

    const {specifier} = (<any>globalThis).__app_package;
    promises.push(bimport(`${specifier}/config`));
    promises.push(bimport(`${specifier}/start`));

    promises.push(bimport('@beyond-js/kernel/core'));
    promises.push(bimport('@beyond-js/kernel/routing'));
    promises.push(bimport('@beyond-js/widgets/routing'));
    promises.push(bimport('@beyond-js/widgets/layout'));

    Promise.all(promises)
        .then(([{default: config}]) => createLayout(config))
        .catch(exc => console.log(exc.stack));
}

(() => {
    if (!(<any>globalThis).__ssr_fetch) {
        startup();
        return;
    }

    /**
     * window.__ssr_fetch is injected in the index.html when routing.ssr is on
     */
    (<any>window).__ssr_fetch.then((ssr: any) => {
        if (!ssr.json || ssr.json.errors?.length) {
            console.error('Error getting ssr data:', ssr.json.errors);
            startup();
            return;
        }

        const promises: Promise<any>[] = [];

        const {specifier} = (<any>globalThis).__app_package;
        promises.push(bimport(`${specifier}/config`));
        promises.push(bimport(`${specifier}/start`));

        promises.push(bimport('@beyond-js/widgets/render'));
        promises.push(bimport('@beyond-js/widgets/layout'));

        Promise.all(promises).then(([{default: config}, , render, layout]) => {
            // Register the widgets
            const specs = new Map(ssr.json.widgets.specs);
            render.widgets.register([...specs.values()]);

            // Register the ssr widgets
            const instances = ssr.json.widgets.instances;
            const prerender: typeof p = render.prerender;
            instances.forEach((instance: any) => prerender.ssr.push(instance));

            // Register the ssr page and layout structure
            const lssr: typeof s = layout.ssr;
            lssr.data(ssr.json.main, ssr.json.page);
            createLayout(config);
        }).catch(exc => console.log(exc.stack));
    });
})();
