/**
 * The quick-switch palette. Reads the sessions/workspaces snapshot stores
 * directly via useSyncExternalStore (both are subscription stores with
 * cached snapshots). Modes: management (shortcuts, workspace-grouped list
 * mirroring the left sidebar), search (S, typing filters a flat list),
 * rename (R). Opening the palette selects the current conversation by
 * default. Skins (深色/浅色/高对比) cycle through the header button and
 * persist in localStorage; the `data-skin` attribute drives the CSS
 * variable palette in switcher.module.css.
 * @module @suxeca/dsh-client-ui-session-switcher/client/switcher
 */
import type { OpenStore } from './open-store.ts';
import type { SwitcherContext } from './port.ts';
import { type KeymapStore } from './keymap.ts';
export interface SwitcherProps {
    readonly ctx: SwitcherContext;
    readonly openStore: OpenStore;
    readonly keymapStore: KeymapStore;
}
/**
 * The palette component. Both render branches carry the skin attribute on
 * their root so the toast (closed) and the card (open) share one variable
 * palette.
 */
export declare function Switcher({ ctx, openStore, keymapStore }: SwitcherProps): JSX.Element | null;
//# sourceMappingURL=switcher.d.ts.map