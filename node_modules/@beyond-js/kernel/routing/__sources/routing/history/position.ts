/**
 * The position of the navigation is stored this way:
 *      1. In the state of each page (the history.state object), it is stored the position
 *         in which the page is located. To achieve this, the __beyond_navigation_position property
 *         is added to the state object.
 *      2. In the sessionStorage is stored the current position (__beyond_navigation_position)
 */
export class HistoryPosition {
    check(): boolean {
        if (this.value) return true;
        console.error('History state is not defined. ' +
            'This happen when state is changed outside the beyond defined navigation flows.');
        return false;
    }

    /**
     * Returns the position from the history.state
     * @returns {number | undefined}
     */
    get value(): number {
        return history.state?.__beyond_navigation_position;
    }

    save(position: number): void {
        const state = history.state ? history.state : {};
        state.__beyond_navigation_position = position;
        history.replaceState(state, null);
    }
}
