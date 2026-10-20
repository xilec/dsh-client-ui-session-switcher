/**
 * Customizable keyboard bindings for the switcher. Rebindable actions (open
 * palette / next / previous / layout chords), persisted in localStorage so
 * the user can rebind entirely inside the web GUI — no CLI/TUI config needed.
 * `Alt+K` stays a fixed safety fallback for opening the palette (never
 * rebindable, so a mis-bound toggle cannot lock the palette out), and `Esc`
 * is a fixed fullscreen-exit chord (never rebindable — universal muscle
 * memory).
 *
 * The layout chords drive the DSH frame (left sidebar) and DSH's own right
 * column through their public services; actions no-op cleanly when the target
 * service is not installed.
 * @module @suxeca/dsh-client-ui-session-switcher/client/keymap
 */
/** Rebindable action ids (order drives the settings list). */
export declare const ACTIONS: readonly ["toggle", "next", "prev", "jumpToPinned", "toggleLeftSidebar", "toggleRightSidebar", "toggleSessionMap"];
export type ActionId = (typeof ACTIONS)[number];
/** One key chord: a non-modifier key plus the exact modifier set. */
export interface Binding {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
}
/**
 * Map a physical `KeyboardEvent.code` to the layout-independent key token it
 * represents. Returns `null` for codes that have no stable Latin equivalent
 * (or for non-character keys), so the caller can fall back to `event.key`.
 * This makes chords fire on the same physical key regardless of the active
 * keyboard layout (Russian, etc.) instead of only on the Latin layout.
 */
export declare function codeToKey(code: string): string | null;
/**
 * Layout-independent key token for a keyboard event: prefer the physical key
 * (`code`) when it maps to a known Latin token, fall back to `key` otherwise.
 * Single characters are lower-cased, matching {@link canonicalKey}.
 */
export declare function eventKey(e: {
    key: string;
    code?: string;
}): string;
/** Is this event key a lone modifier (nothing to bind)? */
export declare function isModifierKey(key: string): boolean;
/** Default bindings — the pre-existing chords plus the VSCode-style layout
 *  chords, platform-adjusted (Ctrl on Win/Linux, Cmd on Mac; Alt+Shift
 *  chords are identical on both). */
export declare function defaultBindings(): Record<ActionId, Binding>;
/** Read persisted bindings, falling back to defaults per action. */
export declare function loadBindings(): Record<ActionId, Binding>;
/** Persist bindings (storage failures ignored). */
export declare function saveBindings(bindings: Record<ActionId, Binding>): void;
/**
 * Does this key event match the binding? Exact on key and every modifier —
 * a chord like Ctrl+K does not fire on Ctrl+Shift+K.
 */
export declare function matchesBinding(binding: Binding, e: {
    key: string;
    code?: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}): boolean;
/** Build a binding from a key event (assumes the key is not a lone modifier). */
export declare function bindingFromEvent(e: {
    key: string;
    code?: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}): Binding;
/** Human-readable chord, e.g. `Ctrl+Shift+K` / `⌘K` / `Ctrl+]`. */
export declare function formatBinding(binding: Binding): string;
/** Keymap store state: bindings plus the capture flag (suppresses global shortcuts mid-rebind). */
export interface KeymapState {
    readonly bindings: Record<ActionId, Binding>;
    readonly capturing: boolean;
}
/** External store interface consumed by useSyncExternalStore and the global handler. */
export interface KeymapStore {
    getSnapshot(): KeymapState;
    subscribe(listener: () => void): () => void;
    set(action: ActionId, binding: Binding): void;
    beginCapture(): void;
    endCapture(): void;
}
/**
 * Create the keymap store (loaded from localStorage, defaults on absence).
 *
 * The snapshot is CACHED and only rebuilt on mutation: useSyncExternalStore
 * requires a referentially stable getSnapshot (a fresh object per call makes
 * React re-render forever — "Maximum update depth exceeded").
 */
export declare function createKeymapStore(): KeymapStore;
//# sourceMappingURL=keymap.d.ts.map