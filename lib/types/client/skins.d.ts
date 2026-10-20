/**
 * Palette skins (深色/浅色/高对比). The color values live as CSS custom
 * properties in switcher.module.css (one `[data-skin=…]` block each); this
 * module only owns the name order and the localStorage persistence; the
 * display labels live in the locale dictionaries (i18n.ts). Flipping the `data-skin` attribute restyles the whole palette.
 * @module @suxeca/dsh-client-ui-session-switcher/client/skins
 */
/** Skin cycle order (the header button steps through it). */
export declare const SKIN_ORDER: readonly ["dark", "light", "highcontrast"];
/** A persisted skin name. */
export type SkinName = (typeof SKIN_ORDER)[number];
/** Type guard: is this a known skin name? */
export declare function isSkinName(value: unknown): value is SkinName;
/** Read the persisted skin, defaulting to dark on absence/corruption. */
export declare function loadSkin(): SkinName;
/** Persist the skin choice (storage failures are ignored). */
export declare function saveSkin(name: SkinName): void;
/** The next skin in the cycle order. */
export declare function nextSkin(name: SkinName): SkinName;
//# sourceMappingURL=skins.d.ts.map