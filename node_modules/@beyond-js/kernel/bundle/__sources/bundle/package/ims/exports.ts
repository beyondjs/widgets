import PackageExports from '../exports';
import {InternalModule} from "./im";

export class IMExports {
    constructor(im: InternalModule, bexports: PackageExports) {
        return new Proxy(this, {
            set: (self: this, name: string, value: any) => {
                // Set the exported property
                (<any>self)[name] = value;

                // Check if it is a bundle exported property
                const prop = bexports.descriptor?.find(({im: id, from}) => {
                    return im.id === id && name === from;
                });
                prop && bexports.set(prop.name, value);
                prop && bexports.process?.({prop: prop.name, value});

                return true;
            }
        });
    }
}
