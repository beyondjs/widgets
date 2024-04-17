export interface Require {
    config: (config: any) => void;

    (modules: string[], ready: Function, errback?: Function): void;

    onError(err: any, errback?: (err: any) => void): void;

    undef(module: string): void;
}
