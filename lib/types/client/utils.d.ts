/**
 * Pure helpers shared by the palette and the Ctrl+[ / Ctrl+] cycle gesture:
 * title projection, relative time, turn count, and the sidebar-faithful
 * ordering/grouping derivation. The canonical order mirrors what the web
 * GUI's left sidebar shows (WorkspaceBrowser default view): workspaces in
 * Host display order, sessions inside each workspace by recency (newest
 * first, id tiebreak — the sidebar's default `updated` order), and
 * unaccounted sessions trailing in recency order. Subagent-origin rows are
 * invisible to both surfaces (they live under parent catalogs); forked /
 * branch conversations (parentId set, ordinary origin) are ordinary rows.
 * Archived and non-current blank sessions are hidden as well.
 * @module @suxeca/dsh-client-ui-session-switcher/client/utils
 */
import type { DecoratedSession, SessionListStateLike, SessionSummaryLike, WorkspaceListStateLike, WorkspaceViewLike } from './port.ts';
/** Display title: the persisted projection, or a placeholder before the first prompt. */
export declare function titleOf(session: SessionSummaryLike): string;
/** Coarse relative time in the active locale, falling back to a compact date. */
export declare function relTime(ts: number | undefined): string;
/**
 * Map a workspace identity to a deterministic color palette index (0..7),
 * or -1 for ungrouped sessions.
 */
export declare function workspaceColorIndex(workspaceId: string | undefined): number;
/** Golden ratio angle in degrees for maximum hue contrast across adjacent nodes. */
export declare const GOLDEN_ANGLE = 137.508;
/**
 * Compute a distinct hue (0..359.9) for a workspace.
 * When colorMap is supplied, the hue is strictly determined by its sequential index,
 * guaranteeing that every distinct workspace receives a completely unique color,
 * and adjacent workspaces in the list/tree receive maximally contrasting hues.
 * Returns null for ungrouped sessions.
 */
export declare function getWorkspaceHue(workspaceId: string | undefined, colorMap?: ReadonlyMap<string, number>): number | null;
/**
 * Compute the recency freshness level for a timestamp:
 * 0: < 15 minutes (emerald vibrant green)
 * 1: < 1 hour (bright green)
 * 2: < 6 hours (fresh green)
 * 3: < 24 hours (lime/yellow-green)
 * 4: < 3 days (pale green / olive)
 * 5: >= 3 days (neutral dim gray)
 */
export declare function timeRecencyLevel(ts: number | undefined, now?: number): 0 | 1 | 2 | 3 | 4 | 5;
/** Session turn count from the sessionStats projection, when present. */
export declare function turnCountOf(session: SessionSummaryLike): number | undefined;
/** The workspace owning a session id, or undefined when unaccounted. */
export declare function workspaceIdOwning(workspaceItems: readonly WorkspaceViewLike[], sessionId: string): string | undefined;
/**
 * Resolve the currently active / displayed session ID from the session list snapshot.
 * DSH marks the active session by setting `session.retainedBy.mainView > 0`.
 * Also supports checking the DOM sidebar treeitem aria-selected attribute as a live fallback.
 */
export declare function currentSessionId(sessionsSnap: SessionListStateLike, hintId?: string): string | undefined;
/** Default inactivity threshold: 7 days. */
export declare const DEFAULT_HIDE_DAYS = 7;
export declare const MS_PER_DAY: number;
export declare const DEFAULT_STALE_MS: number;
/**
 * Determine if a session is inactive / stale (has not been updated within staleMs).
 * The current session, pinned sessions, and any actively running session are NEVER stale.
 */
export declare function isStaleSession(session: SessionSummaryLike, options?: {
    now?: number;
    staleMs?: number;
    currentId?: string;
    pinnedIds?: ReadonlySet<string>;
}): boolean;
/**
 * The sidebar-faithful flat order: workspaces in Host display order, their
 * sessions with pinned ones leading followed by recency order (matching WorkspaceBrowser),
 * then unaccounted sessions trailing. This is the exact visual order the left
 * sidebar shows, so Ctrl+[ / Ctrl+] move up/down the list the user sees on the left.
 */
export declare function sidebarOrder(sessionsSnap: SessionListStateLike, workspacesSnap: WorkspaceListStateLike, options?: {
    currentId?: string;
}): DecoratedSession[];
/**
 * Return all visible pinned sessions across all workspaces in order.
 */
export declare function pinnedSessions(sessionsSnap: SessionListStateLike, workspacesSnap: WorkspaceListStateLike, options?: {
    currentId?: string;
}): DecoratedSession[];
/**
 * Global recency order (newest first, id tiebreak): lists all visible sessions
 * sorted strictly by their updatedAt timestamp regardless of workspace boundaries.
 * This puts the most recently active sessions right at the top for instant switching.
 */
export declare function recencyOrder(sessionsSnap: SessionListStateLike, workspacesSnap: WorkspaceListStateLike, options?: {
    currentId?: string;
}): DecoratedSession[];
/** Key for the ungrouped bucket in the palette item list. */
export declare const UNGROUPED_KEY = "__ungrouped__";
/** Options controlling palette ordering and inactive session folding. */
export interface PaletteOptions {
    /** Sort strategy: 'sidebar' preserves left-sidebar workspace order; 'recency' sorts globally newest first. */
    sort?: 'sidebar' | 'recency';
    /** Whether to fold stale sessions into collapsible toggle items. */
    hideStale?: boolean;
    /** Timestamp considered "now" (defaults to Date.now()). */
    now?: number;
    /** Inactivity threshold in ms (defaults to 7 days). */
    staleMs?: number;
    /** Current session ID (never folded). */
    currentId?: string;
    /** Set of pinned session IDs (never folded). */
    pinnedIds?: ReadonlySet<string>;
    /** Set of group keys currently expanded by the user (e.g. '__all__' or workspaceId). */
    expandedGroups?: ReadonlySet<string>;
}
/** One palette list item: a workspace section header, a session row, or a folded toggle item. */
export type PaletteItem = {
    readonly kind: 'header';
    readonly key: string;
    readonly label: string;
    readonly count: number;
} | {
    readonly kind: 'row';
    readonly session: SessionSummaryLike;
    readonly workspace?: WorkspaceViewLike;
    readonly stale?: boolean;
} | {
    readonly kind: 'folded';
    readonly key: string;
    readonly groupKey: string;
    readonly count: number;
    readonly label: string;
    readonly expanded: boolean;
};
/** A flattened row item (type-narrowed). */
export type PaletteRow = Extract<PaletteItem, {
    readonly kind: 'row';
}>;
/**
 * The row-only index of a session in a palette list (headers and folded rows skipped),
 * or -1 when the session is absent or no id is given. This is the selection
 * position the palette's keyboard navigation uses.
 */
export declare function rowIndexOf(items: readonly PaletteItem[], sessionId: string | undefined): number;
/**
 * The palette list: in management mode, sessions grouped under workspace
 * section headers (sidebar layout); empty sections are skipped. The flat
 * form feeds search and the quick switch view. Supports automatic hiding
 * of older/inactive sessions.
 */
export declare function paletteItems(sessionsSnap: SessionListStateLike, workspacesSnap: WorkspaceListStateLike, view: 'grouped' | 'flat', options?: PaletteOptions): PaletteItem[];
/**
 * Archived (non-subagent) sessions for the archived view, recency order.
 * The sidebar hides archived rows everywhere, so this list is flat. Each
 * entry carries its owning workspace when one exists: archiving never
 * touches workspace accounting (the host keeps the `sessionIds` slot), so
 * the pre-archive group is still derivable from the workspace items; only
 * sessions no workspace ever claimed stay ungrouped.
 */
export declare function archivedSessions(sessionsSnap: SessionListStateLike, workspacesSnap: WorkspaceListStateLike): DecoratedSession[];
/**
 * The cycle-gesture anchor: the current session id when it is itself in the
 * list (forked/branch conversations are list rows), otherwise — e.g. a
 * subagent child that lives under its parent's catalog — the nearest
 * ancestor that is in the list, so Ctrl+[ / Ctrl+] move relative to the row
 * the sidebar highlights.
 */
export declare function cycleAnchor(entries: readonly DecoratedSession[], currentId: string | undefined, byId: SessionListStateLike['byId']): string | undefined;
/** Walk subagent lineage up to the root ancestor of a session. */
export declare function cycleAnchorId(currentId: string | undefined, byId: SessionListStateLike['byId']): string | undefined;
/**
 * The conversation `offset` positions away from the anchor, wrapping around.
 * A missing anchor lands on the first (positive) or last (negative) entry.
 */
export declare function offsetTarget(entries: readonly DecoratedSession[], anchorId: string | undefined, offset: number): DecoratedSession | undefined;
//# sourceMappingURL=utils.d.ts.map