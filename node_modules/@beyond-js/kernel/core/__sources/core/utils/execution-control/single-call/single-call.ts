export /*bundle*/
function SingleCall(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let promises = new WeakMap<any, Promise<any>>();

    descriptor.value = function (...args: any): Promise<any> {
        if (promises.has(this)) return promises.get(this);

        const promise = originalMethod.apply(this, args);
        promises.set(this, promise);

        const clean = () => promises.delete(this);
        promise.then(clean).catch(clean);
        return promise;
    };
    return descriptor;
}
