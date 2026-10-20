/**
 * Tiny external store for the palette lifecycle: `open` (the quick-switch
 * card) and `preview` (Space-preview of a selected conversation — the card
 * is hidden and the dialog is shown; Esc returns to the card, Enter
 * confirms). useSyncExternalStore-shaped.
 * @module @suxeca/dsh-client-ui-session-switcher/client/open-store
 */
/** One palette lifecycle snapshot. */
export interface OpenState {
    /** The quick-switch card is visible. */
    open: boolean;
    /** A conversation preview is active (card hidden, dialog shown). */
    preview: boolean;
    /** The conversation being previewed. */
    previewTargetId?: string;
    /** The conversation to restore on Esc (the one active before preview). */
    previewFromId?: string;
}
/** External store interface consumed by useSyncExternalStore. */
export interface OpenStore {
    getSnapshot(): OpenState;
    subscribe(listener: () => void): () => void;
    toggle(): void;
    close(): void;
    /** Enter preview: hide the card and switch to `targetId` (remember `fromId`
     *  so Esc can restore it). The session switch itself is the caller's job. */
    enterPreview(targetId: string, fromId: string | undefined): void;
    /** Leave preview and return to the card (Esc). */
    exitPreview(): void;
    /** Leave preview for good, entering the previewed conversation (Enter). */
    confirmPreview(): void;
}
/** Create the palette lifecycle store (snapshot-cached, manual notify). */
export declare function createOpenStore(): OpenStore;
//# sourceMappingURL=open-store.d.ts.map