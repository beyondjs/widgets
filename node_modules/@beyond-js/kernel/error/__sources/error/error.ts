interface CallSite {
    isNative: () => boolean;
    getFileName: () => string;
    getLineNumber: () => number;
    getColumnNumber: () => number;
}

const prepareStackTrace = (Error: any): void => {
    Error.prepareStackTrace = (err: Error, frames: CallSite[]) => {
        for (const frame of frames) {
            if (frame.isNative()) continue;

            const file = frame.getFileName();
            const line = frame.getLineNumber();
            const column = frame.getColumnNumber();

            console.log(file, line, column);
        }

        return err.stack;
    }
}

(Error as any).prepareStackTrace && prepareStackTrace(Error);
