/**
 * Client bundle entry: global shortcut wiring (customizable chords for open /
 * next / previous, the layout chords driving the DSH frame and the
 * better-sidebar workbench, plus the fixed Alt+K fallback and Esc
 * fullscreen-exit) and the palette mount.
 *
 * Failure policy: DOM mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and an external
 * plugin must not take the GUI down.
 * @module @suxeca/dsh-client-ui-session-switcher/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
/** Services the switcher reads from the context (service names, not modules).
 *  `layout` / `sidebarRight` are intentionally NOT injected: the layout
 *  chords must degrade gracefully (log + no-op) when either service is absent
 *  (non-web profiles), so they resolve lazily behind a guard instead. */
export declare const inject: string[];
/**
 * Mount the switcher: one React root hosting the palette, plus the global
 * keydown handler (driven by the customizable keymap). Torn down on dispose.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map