export class QueryString extends Map<string, string> {
    constructor(search: string) {
        super();

        if (search.trim() === '') return;
        search = (search.slice(0, 1) === '?') ? search.slice(1) : search;
        const split = search.split('&');

        for (let i = 0; i < split.length; ++i) {
            const param = split[i].split('=', 2);
            const value = param[1] ?
                decodeURIComponent(param[1].replace(/\+/g, ' ')) : undefined;
            this.set(param[0], value);
        }
    }
}
