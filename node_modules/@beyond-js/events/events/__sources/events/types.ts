/*
Required by the constructor of the Events class
 */
export interface Inherited {
    bind: (event: string, listener: ListenerFunction, priority: number) => void,
    unbind: (event: string, Listener: ListenerFunction) => void
}

export interface EventsSpecs {
    supported?: [string],
    bind?: Inherited,
}


/*
The listener specification can be just a function or an object with the function + other specs
 */
export /*bundle*/ type ListenerFunction = (...args: any) => void;

export interface ListenerSpecs {
    listener: ListenerFunction,
    priority: number
}

/*
The trigger specification can be just the name of the event, or the name + other specs
 */
export interface TriggerSpecs {
    name: string,
    async?: boolean
}

export type Trigger = string | TriggerSpecs;
