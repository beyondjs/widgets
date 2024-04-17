export /*bundle*/
class CancellationToken {
    #id = 0;

    get current() {
        return this.#id;
    }

    reset = () => ++this.#id;
    check = (id: number) => id === this.#id;
}
