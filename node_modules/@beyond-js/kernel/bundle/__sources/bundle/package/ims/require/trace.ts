interface RequireTrace {
    source: string,
    id: string
}

// Used to find cyclical requires of internal modules
// Key is the id being required and the value is the source
export class Trace extends Array<RequireTrace> {
    has = (id: string) => this.find(rt => rt.id === id);

    register(source: string, id: string) {
        // Check for cyclical module require
        if (this.has(id)) {
            let traced = '';
            this.forEach(({id, source}) => {
                const s = ['initialisation', 'exports.update'].includes(source) ?
                    'Cycle initiates with source'
                    : `then "${source}" requires`;
                traced += `\t${s} "${id}"\n`
            });
            traced += `\tthat finally requires "${id}" again.\n`;

            throw new Error(`Recursive module load found.\n` +
                `Internal module "${source}" is requiring another internal module that was previously required: "${id}"\n` +
                `Trace of required modules:\n${traced}`);
        }

        this.push({id, source});
    }
}
