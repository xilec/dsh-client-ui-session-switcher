/**
 * Tiny external store for the palette lifecycle: `open` (the quick-switch
 * card) and `preview` (Space-preview of a selected conversation — the card
 * is hidden and the dialog is shown; Esc returns to the card, Enter
 * confirms). useSyncExternalStore-shaped.
 * @module @suxeca/dsh-client-ui-session-switcher/client/open-store
 */
/** Create the palette lifecycle store (snapshot-cached, manual notify). */
export function createOpenStore() {
    let state = { open: false, preview: false };
    const listeners = new Set();
    const refresh = (next) => {
        if (next === state)
            return;
        state = next;
        for (const listener of [...listeners])
            listener();
    };
    return {
        getSnapshot: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        toggle: () => {
            // Toggling from open or preview collapses everything back to closed.
            refresh(state.open || state.preview
                ? { open: false, preview: false }
                : { open: true, preview: false });
        },
        close: () => {
            if (!state.open && !state.preview)
                return;
            refresh({ open: false, preview: false });
        },
        enterPreview: (targetId, fromId) => {
            refresh({
                open: false, preview: true,
                previewTargetId: targetId,
                ...(fromId === undefined ? {} : { previewFromId: fromId }),
            });
        },
        exitPreview: () => {
            if (!state.preview)
                return;
            refresh({ open: true, preview: false });
        },
        confirmPreview: () => {
            if (!state.preview)
                return;
            refresh({ open: false, preview: false });
        },
    };
}
