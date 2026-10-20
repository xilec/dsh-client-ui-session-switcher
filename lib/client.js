window.__ModuleLoader__.load({
	id: "@suxeca/dsh-client-ui-session-switcher",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom_client = require("react-dom/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/keymap.ts
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
		const ACTIONS = [
			"toggle",
			"next",
			"prev",
			"jumpToPinned",
			"toggleLeftSidebar",
			"toggleRightSidebar",
			"toggleSessionMap"
		];
		/** localStorage key backing the persisted keymap. */
		const KEYMAP_KEY = "dsh.sessionSwitcher.keymap";
		/** Platform probe (safe under SSR / tests: no navigator → non-Mac). */
		function isMac() {
			return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
		}
		/** Modifier keys that cannot be a binding on their own. */
		const MODIFIER_KEYS = /* @__PURE__ */ new Set([
			"Control",
			"Shift",
			"Alt",
			"Meta",
			"AltGraph",
			"CapsLock",
			"NumLock",
			"ScrollLock",
			"Fn",
			"FnLock",
			"Hyper",
			"Super",
			"Symbol",
			"SymbolLock",
			"Process",
			"Dead",
			"Unidentified"
		]);
		/** Canonical key token: single characters lowercase, others unchanged. */
		function canonicalKey(key) {
			return key.length === 1 ? key.toLowerCase() : key;
		}
		/**
		* Map a physical `KeyboardEvent.code` to the layout-independent key token it
		* represents. Returns `null` for codes that have no stable Latin equivalent
		* (or for non-character keys), so the caller can fall back to `event.key`.
		* This makes chords fire on the same physical key regardless of the active
		* keyboard layout (Russian, etc.) instead of only on the Latin layout.
		*/
		function codeToKey(code) {
			if (code === "") return null;
			if (code.startsWith("Key")) return code.slice(3).toLowerCase();
			if (code.startsWith("Digit")) return code.slice(5);
			const named = {
				BracketLeft: "[",
				BracketRight: "]",
				Slash: "/",
				Backslash: "\\",
				IntlBackslash: "\\",
				Semicolon: ";",
				Quote: "'",
				Comma: ",",
				Period: ".",
				Minus: "-",
				Equal: "=",
				Backquote: "`",
				Space: " ",
				Numpad0: "0",
				Numpad1: "1",
				Numpad2: "2",
				Numpad3: "3",
				Numpad4: "4",
				Numpad5: "5",
				Numpad6: "6",
				Numpad7: "7",
				Numpad8: "8",
				Numpad9: "9",
				NumpadAdd: "+",
				NumpadSubtract: "-",
				NumpadMultiply: "*",
				NumpadDivide: "/",
				NumpadDecimal: "."
			};
			return Object.prototype.hasOwnProperty.call(named, code) ? named[code] : null;
		}
		/**
		* Layout-independent key token for a keyboard event: prefer the physical key
		* (`code`) when it maps to a known Latin token, fall back to `key` otherwise.
		* Single characters are lower-cased, matching {@link canonicalKey}.
		*/
		function eventKey(e) {
			if (e.code !== void 0) {
				const mapped = codeToKey(e.code);
				if (mapped !== null) return canonicalKey(mapped);
			}
			return canonicalKey(e.key);
		}
		/** Is this event key a lone modifier (nothing to bind)? */
		function isModifierKey(key) {
			return MODIFIER_KEYS.has(key) || key === "";
		}
		/** Default bindings — the pre-existing chords plus the VSCode-style layout
		*  chords, platform-adjusted (Ctrl on Win/Linux, Cmd on Mac; Alt+Shift
		*  chords are identical on both). */
		function defaultBindings() {
			const mac = isMac();
			const primary = () => mac ? {
				ctrl: false,
				meta: true
			} : {
				ctrl: true,
				meta: false
			};
			return {
				toggle: {
					key: "k",
					...primary(),
					shift: false,
					alt: false
				},
				next: {
					key: "]",
					...primary(),
					shift: false,
					alt: false
				},
				prev: {
					key: "[",
					...primary(),
					shift: false,
					alt: false
				},
				jumpToPinned: {
					key: "p",
					ctrl: false,
					meta: false,
					shift: false,
					alt: true
				},
				toggleLeftSidebar: {
					key: "b",
					...primary(),
					shift: false,
					alt: false
				},
				toggleRightSidebar: {
					key: "b",
					...primary(),
					shift: true,
					alt: false
				},
				toggleSessionMap: {
					key: "m",
					...primary(),
					shift: true,
					alt: false
				}
			};
		}
		/** Validate an unknown JSON value as a binding. */
		function isBinding(value) {
			if (typeof value !== "object" || value === null) return false;
			const b = value;
			return typeof b.key === "string" && b.key !== "" && !isModifierKey(b.key) && typeof b.ctrl === "boolean" && typeof b.shift === "boolean" && typeof b.alt === "boolean" && typeof b.meta === "boolean";
		}
		/** Read persisted bindings, falling back to defaults per action. */
		function loadBindings() {
			const defaults = defaultBindings();
			try {
				const raw = localStorage.getItem(KEYMAP_KEY);
				if (raw === null) return defaults;
				const parsed = JSON.parse(raw);
				if (typeof parsed !== "object" || parsed === null) return defaults;
				const record = parsed;
				const out = { ...defaults };
				for (const action of ACTIONS) if (isBinding(record[action])) out[action] = record[action];
				return out;
			} catch {
				return defaults;
			}
		}
		/** Persist bindings (storage failures ignored). */
		function saveBindings(bindings) {
			try {
				localStorage.setItem(KEYMAP_KEY, JSON.stringify(bindings));
			} catch {}
		}
		/**
		* Does this key event match the binding? Exact on key and every modifier —
		* a chord like Ctrl+K does not fire on Ctrl+Shift+K.
		*/
		function matchesBinding(binding, e) {
			return eventKey(e) === canonicalKey(binding.key) && e.ctrlKey === binding.ctrl && e.shiftKey === binding.shift && e.altKey === binding.alt && e.metaKey === binding.meta;
		}
		/** Build a binding from a key event (assumes the key is not a lone modifier). */
		function bindingFromEvent(e) {
			return {
				key: eventKey(e),
				ctrl: e.ctrlKey,
				shift: e.shiftKey,
				alt: e.altKey,
				meta: e.metaKey
			};
		}
		/** Human-readable chord, e.g. `Ctrl+Shift+K` / `⌘K` / `Ctrl+]`. */
		function formatBinding(binding) {
			const parts = [];
			if (binding.ctrl) parts.push("Ctrl");
			if (binding.alt) parts.push("Alt");
			if (binding.shift) parts.push("Shift");
			if (binding.meta) parts.push(isMac() ? "⌘" : "Meta");
			const key = binding.key.length === 1 ? binding.key.toUpperCase() : binding.key;
			parts.push(key);
			return parts.join("+");
		}
		/**
		* Create the keymap store (loaded from localStorage, defaults on absence).
		*
		* The snapshot is CACHED and only rebuilt on mutation: useSyncExternalStore
		* requires a referentially stable getSnapshot (a fresh object per call makes
		* React re-render forever — "Maximum update depth exceeded").
		*/
		function createKeymapStore() {
			let bindings = loadBindings();
			let capturing = false;
			let snapshot = {
				bindings,
				capturing
			};
			const listeners = /* @__PURE__ */ new Set();
			const refresh = () => {
				snapshot = {
					bindings,
					capturing
				};
				for (const listener of [...listeners]) listener();
			};
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set: (action, binding) => {
					bindings = {
						...bindings,
						[action]: binding
					};
					capturing = false;
					saveBindings(bindings);
					refresh();
				},
				beginCapture: () => {
					capturing = true;
					refresh();
				},
				endCapture: () => {
					capturing = false;
					refresh();
				}
			};
		}
		//#endregion
		//#region src/client/i18n.ts
		/**
		* Localization for the session-switcher palette.
		*
		* ## Why the palette follows the platform locale
		*
		* The switcher ships Chinese (`zh`) and English (`en`) dictionaries and reads
		* the platform's `locale` service when it is mounted, so the palette, its
		* settings and the official-shortcut labels agree with the rest of DSH — a
		* switch in Settings → General switches the palette too, instead of leaving
		* it in one language while the rest of the app is in another.
		*
		* ## Why the dictionaries live here rather than in the platform catalog
		*
		* The service also offers `register(ns, …)` + `bind(ns)`, which first-party
		* plugins use. That path is typed against `LocaleNamespaceMap`, which a plugin
		* outside the DSH repository cannot augment. The interface below buys the
		* property that actually matters instead: **both dictionaries implement the
		* same type**, so a missing English string is a compile error rather than a
		* Chinese string surfacing in an English UI.
		*
		* @module @suxeca/dsh-client-ui-session-switcher/client/i18n
		*/
		const ZH = {
			actionLabels: {
				toggle: "打开面板",
				next: "下一个对话",
				prev: "上一个对话",
				jumpToPinned: "切换至置顶对话",
				toggleLeftSidebar: "折叠/展开左侧栏",
				toggleRightSidebar: "折叠/展开右侧栏",
				toggleSessionMap: "切换 对话/会话地图"
			},
			skinLabels: {
				dark: "深色",
				light: "浅色",
				highcontrast: "高对比"
			},
			toastReady: "会话切换器已就绪 — Ctrl+Shift+K（Ctrl+K / Alt+K）打开面板",
			readyMessage: "[session-switcher] 已就绪 — 快捷键可在面板内自定义（⚙ 快捷键）",
			untitled: "未命名对话",
			justNow: "刚刚",
			minutesBefore: (count) => `${count} 分钟前`,
			hoursBefore: (count) => `${count} 小时前`,
			daysBefore: (count) => `${count} 天前`,
			noNewSession: "未提供新建会话功能",
			newSessionFailed: (detail) => `新建会话失败：${detail}`,
			archiveFailed: (detail) => `归档失败：${detail}`,
			unarchiveFailed: (detail) => `取消归档失败：${detail}`,
			renameFailed: (detail) => `重命名失败：${detail}`,
			renameRejected: "重命名被拒绝",
			renameOffline: "会话不在线，无法重命名",
			noMatches: "没有匹配的对话",
			noArchived: "没有已归档的对话",
			noWorkspaces: "还没有工作区 — 按 N 新建，或在侧边栏添加工作区",
			noConversations: "还没有对话 — 按 N 新建",
			loading: "加载中…",
			renamePlaceholder: "输入新标题…",
			save: "保存",
			cancel: "取消",
			searchPlaceholder: "输入标题过滤对话…（支持快捷键：Ctrl+N新建 / Ctrl+R重命名 / Alt+H切换近期）",
			searchStrip: "按 S 搜索会话…",
			title: "切换对话",
			modeArchived: "已归档",
			modeSearch: "搜索",
			modeRename: "重命名",
			modeShortcuts: "快捷键",
			hideOldRecent: "🕒 近期对话",
			hideOldAll: "🕒 全部对话",
			hideOldTitleRecent: "当前已隐藏 7 天前较早对话（点击查看全部）",
			hideOldTitleAll: "当前显示全部对话（点击隐藏 7 天前较早对话）",
			settingsTitle: "自定义快捷键",
			newConversation: "+ 新建对话",
			skinTitle: "切换皮肤（深色/浅色/高对比）",
			ungrouped: "未分组",
			turns: (count) => `${count} 轮`,
			current: "当前",
			pinned: "📌 置顶",
			archived: "已归档",
			rowRename: "重命名",
			rowUnarchive: "取消归档",
			rowArchive: "归档",
			renameTitle: "重命名对话",
			collapseOlderTitle: "点击收起较早对话",
			expandOlderTitle: "点击展开较早对话",
			collapseShownOlder: (count) => `收起已显示的 ${count} 个较早对话`,
			hiddenOlder: (count) => `已自动隐藏 ${count} 个较早对话 (点击展开)`,
			officialShortcutsBtn: "⚡ 打开系统快捷键设置中心 (Ctrl+/)",
			settingsHint: "会话面板快捷键已接入 DSH 官方命令系统，可点击上方按钮前往系统中心统一修改并检测冲突；亦可在下方快速覆盖面板本地按键，Esc 取消。",
			captureHint: "按下新组合键…（Esc 取消）",
			changeKey: "改键",
			select: "选择",
			newShort: "新建",
			renameShort: "重命名",
			archiveShort: "归档",
			pinnedShort: "置顶",
			showAll: "显示全部",
			recentOnly: "只看近期",
			clear: "清空",
			manageMode: "管理模式",
			preview: "预览",
			search: "搜索",
			backToList: "返回列表",
			archivedView: "归档视图",
			shortcuts: "快捷键",
			close: "关闭",
			open: "打开",
			toggle: "开关",
			space: "空格",
			officialToggleLabel: "会话切换：打开/关闭面板",
			officialNextLabel: "会话切换：下一个会话",
			officialPrevLabel: "会话切换：上一个会话",
			officialPinnedLabel: "会话切换：切换至置顶对话",
			aliasesToggle: [
				"session switcher",
				"quick switch",
				"ctrl k panel",
				"切换对话"
			],
			aliasesNext: ["next session", "下一个对话"],
			aliasesPrev: ["previous session", "上一个对话"],
			aliasesPinned: [
				"jump to pinned",
				"pinned session",
				"置顶对话"
			]
		};
		const EN = {
			actionLabels: {
				toggle: "Open panel",
				next: "Next conversation",
				prev: "Previous conversation",
				jumpToPinned: "Jump to pinned",
				toggleLeftSidebar: "Toggle left sidebar",
				toggleRightSidebar: "Toggle right sidebar",
				toggleSessionMap: "Toggle session map"
			},
			skinLabels: {
				dark: "Dark",
				light: "Light",
				highcontrast: "High contrast"
			},
			toastReady: "Session switcher ready — Ctrl+Shift+K (Ctrl+K / Alt+K) to open",
			readyMessage: "[session-switcher] ready — shortcuts are customizable from the palette (⚙ Shortcuts)",
			untitled: "Untitled conversation",
			justNow: "just now",
			minutesBefore: (count) => `${count} min ago`,
			hoursBefore: (count) => `${count} h ago`,
			daysBefore: (count) => `${count} d ago`,
			noNewSession: "New-session action not available",
			newSessionFailed: (detail) => `Failed to create session: ${detail}`,
			archiveFailed: (detail) => `Archive failed: ${detail}`,
			unarchiveFailed: (detail) => `Unarchive failed: ${detail}`,
			renameFailed: (detail) => `Rename failed: ${detail}`,
			renameRejected: "Rename rejected",
			renameOffline: "Session is offline, cannot rename",
			noMatches: "No matching conversations",
			noArchived: "No archived conversations",
			noWorkspaces: "No workspaces yet — press N to create one, or add a workspace in the sidebar",
			noConversations: "No conversations yet — press N to create one",
			loading: "Loading…",
			renamePlaceholder: "New title…",
			save: "Save",
			cancel: "Cancel",
			searchPlaceholder: "Filter conversations by title… (shortcuts: Ctrl+N new / Ctrl+R rename / Alt+H recent)",
			searchStrip: "Press S to search sessions…",
			title: "Switch conversation",
			modeArchived: "Archived",
			modeSearch: "Search",
			modeRename: "Rename",
			modeShortcuts: "Shortcuts",
			hideOldRecent: "🕒 Recent",
			hideOldAll: "🕒 All",
			hideOldTitleRecent: "Hiding conversations older than 7 days (click to show all)",
			hideOldTitleAll: "Showing all conversations (click to hide older ones)",
			settingsTitle: "Customize shortcuts",
			newConversation: "+ New conversation",
			skinTitle: "Switch skin (dark / light / high contrast)",
			ungrouped: "Ungrouped",
			turns: (count) => `${count} turns`,
			current: "Current",
			pinned: "📌 Pinned",
			archived: "Archived",
			rowRename: "Rename",
			rowUnarchive: "Unarchive",
			rowArchive: "Archive",
			renameTitle: "Rename conversation",
			collapseOlderTitle: "Click to collapse older conversations",
			expandOlderTitle: "Click to expand older conversations",
			collapseShownOlder: (count) => `Collapse ${count} older conversations already shown`,
			hiddenOlder: (count) => `${count} older conversations hidden automatically (click to expand)`,
			officialShortcutsBtn: "⚡ Open system shortcut settings (Ctrl+/)",
			settingsHint: "The panel shortcuts are wired into DSH’s official command system. Use the button above to manage them centrally and detect conflicts; override keys below, Esc to cancel.",
			captureHint: "Press a new chord… (Esc to cancel)",
			changeKey: "Rebind",
			select: "select",
			newShort: "new",
			renameShort: "rename",
			archiveShort: "archive",
			pinnedShort: "pinned",
			showAll: "show all",
			recentOnly: "recent only",
			clear: "clear",
			manageMode: "manage mode",
			preview: "preview",
			search: "search",
			backToList: "back to list",
			archivedView: "archived view",
			shortcuts: "shortcuts",
			close: "close",
			open: "open",
			toggle: "toggle",
			space: "space",
			officialToggleLabel: "Session switcher: open/close panel",
			officialNextLabel: "Session switcher: next session",
			officialPrevLabel: "Session switcher: previous session",
			officialPinnedLabel: "Session switcher: jump to pinned",
			aliasesToggle: [
				"session switcher",
				"quick switch",
				"ctrl k panel"
			],
			aliasesNext: ["next session"],
			aliasesPrev: ["previous session"],
			aliasesPinned: ["jump to pinned", "pinned session"]
		};
		let service;
		let fallback = "zh";
		const listeners = /* @__PURE__ */ new Set();
		function notify() {
			for (const listener of [...listeners]) listener();
		}
		function installSwitcherLocale(candidate) {
			if (candidate === void 0 || candidate === null) return () => {};
			const installed = candidate;
			service = installed;
			notify();
			return () => {
				if (service !== installed) return;
				service = void 0;
				notify();
			};
		}
		function switcherLocale() {
			if (service === void 0) return fallback;
			return service.getSnapshot().active === "zh" ? "zh" : "en";
		}
		let serviceOff;
		function subscribeSwitcherLocale(listener) {
			listeners.add(listener);
			if (listeners.size === 1 && service !== void 0) serviceOff = service.subscribe(notify);
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) {
					serviceOff?.();
					serviceOff = void 0;
				}
			};
		}
		function switcherStrings() {
			return switcherLocale() === "en" ? EN : ZH;
		}
		function useSwitcherStrings() {
			(0, react.useSyncExternalStore)(subscribeSwitcherLocale, switcherLocale, switcherLocale);
			return switcherStrings();
		}
		//#endregion
		//#region src/client/open-store.ts
		/** Create the palette lifecycle store (snapshot-cached, manual notify). */
		function createOpenStore() {
			let state = {
				open: false,
				preview: false
			};
			const listeners = /* @__PURE__ */ new Set();
			const refresh = (next) => {
				if (next === state) return;
				state = next;
				for (const listener of [...listeners]) listener();
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
					refresh(state.open || state.preview ? {
						open: false,
						preview: false
					} : {
						open: true,
						preview: false
					});
				},
				close: () => {
					if (!state.open && !state.preview) return;
					refresh({
						open: false,
						preview: false
					});
				},
				enterPreview: (targetId, fromId) => {
					refresh({
						open: false,
						preview: true,
						previewTargetId: targetId,
						...fromId === void 0 ? {} : { previewFromId: fromId }
					});
				},
				exitPreview: () => {
					if (!state.preview) return;
					refresh({
						open: true,
						preview: false
					});
				},
				confirmPreview: () => {
					if (!state.preview) return;
					refresh({
						open: false,
						preview: false
					});
				}
			};
		}
		//#endregion
		//#region src/client/utils.ts
		/** Display title: the persisted projection, or a placeholder before the first prompt. */
		function titleOf(session) {
			const title = session.title ?? session.displayTitle;
			if (typeof title === "string" && title.trim() !== "") return title;
			return switcherStrings().untitled;
		}
		/** Coarse relative time in the active locale, falling back to a compact date. */
		function relTime(ts) {
			if (typeof ts !== "number" || !Number.isFinite(ts)) return "";
			const strings = switcherStrings();
			const diff = Date.now() - ts;
			const minutes = Math.floor(diff / 6e4);
			if (minutes < 1) return strings.justNow;
			if (minutes < 60) return strings.minutesBefore(minutes);
			const hours = Math.floor(minutes / 60);
			if (hours < 24) return strings.hoursBefore(hours);
			const days = Math.floor(hours / 24);
			if (days < 7) return strings.daysBefore(days);
			const d = new Date(ts);
			return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
		}
		/** Golden ratio angle in degrees for maximum hue contrast across adjacent nodes. */
		const GOLDEN_ANGLE = 137.508;
		/**
		* Compute a distinct hue (0..359.9) for a workspace.
		* When colorMap is supplied, the hue is strictly determined by its sequential index,
		* guaranteeing that every distinct workspace receives a completely unique color,
		* and adjacent workspaces in the list/tree receive maximally contrasting hues.
		* Returns null for ungrouped sessions.
		*/
		function getWorkspaceHue(workspaceId, colorMap) {
			if (workspaceId === void 0 || workspaceId.trim() === "") return null;
			let index = colorMap?.get(workspaceId);
			if (index === void 0) {
				let hash = 0;
				for (let i = 0; i < workspaceId.length; i++) hash = hash * 31 + workspaceId.charCodeAt(i) >>> 0;
				index = hash % 360;
			}
			return Math.round(index * GOLDEN_ANGLE % 360 * 10) / 10;
		}
		/**
		* Compute the recency freshness level for a timestamp:
		* 0: < 15 minutes (emerald vibrant green)
		* 1: < 1 hour (bright green)
		* 2: < 6 hours (fresh green)
		* 3: < 24 hours (lime/yellow-green)
		* 4: < 3 days (pale green / olive)
		* 5: >= 3 days (neutral dim gray)
		*/
		function timeRecencyLevel(ts, now = Date.now()) {
			if (typeof ts !== "number" || !Number.isFinite(ts) || ts <= 0) return 5;
			const diff = Math.max(0, now - ts);
			const minute = 6e4;
			const hour = 60 * minute;
			const day = 24 * hour;
			if (diff < 15 * minute) return 0;
			if (diff < hour) return 1;
			if (diff < 6 * hour) return 2;
			if (diff < day) return 3;
			if (diff < 3 * day) return 4;
			return 5;
		}
		/** Session turn count from the sessionStats projection, when present. */
		function turnCountOf(session) {
			const turns = session.projectionValues?.sessionStats?.turns;
			return typeof turns === "number" && Number.isFinite(turns) && turns > 0 ? turns : void 0;
		}
		/** The workspace owning a session id, or undefined when unaccounted. */
		function workspaceIdOwning(workspaceItems, sessionId) {
			return workspaceItems.find((w) => w.sessionIds.includes(sessionId))?.workspaceId;
		}
		/** Sidebar recency comparator: newest first, session id as the tiebreak. */
		function byRecency(a, b) {
			if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
			return a.id < b.id ? -1 : 1;
		}
		/**
		* Sidebar visibility rule, mirroring the WorkspaceBrowser derivation
		* (`sessionVisible` in ui-workspace/tree.ts): subagent-origin rows, archived
		* rows, and non-current blank rows are hidden. Forked/branch conversations
		* (parentId set, ordinary origin) are ordinary rows — no parentId check.
		*/
		function sessionVisible(session, currentId, archivedIds) {
			return session.origin !== "subagent" && !archivedIds.has(session.id) && (!session.blank || session.id === currentId);
		}
		/**
		* Resolve the currently active / displayed session ID from the session list snapshot.
		* DSH marks the active session by setting `session.retainedBy.mainView > 0`.
		* Also supports checking the DOM sidebar treeitem aria-selected attribute as a live fallback.
		*/
		function currentSessionId(sessionsSnap, hintId) {
			if (hintId !== void 0 && hintId !== "") return hintId;
			if (sessionsSnap.current !== void 0 && sessionsSnap.current !== "") return sessionsSnap.current;
			const byId = sessionsSnap.byId ?? {};
			for (const s of Object.values(byId)) if (s !== void 0 && (s.retainedBy?.mainView ?? 0) > 0) return s.id;
			if (typeof document !== "undefined") {
				const el = document.querySelector("[data-row-key^=\"session:\"][aria-selected=\"true\"]");
				if (el) {
					const key = el.getAttribute("data-row-key");
					if (key && key.startsWith("session:")) {
						const id = key.slice(8);
						if (byId[id] !== void 0) return id;
					}
				}
			}
		}
		/**
		* Determine if a session is inactive / stale (has not been updated within staleMs).
		* The current session, pinned sessions, and any actively running session are NEVER stale.
		*/
		function isStaleSession(session, options) {
			if (options?.currentId !== void 0 && session.id === options.currentId) return false;
			if (options?.pinnedIds !== void 0 && options.pinnedIds.has(session.id)) return false;
			if (session.running) return false;
			const now = options?.now ?? Date.now();
			const staleMs = options?.staleMs ?? 6048e5;
			if (typeof session.updatedAt !== "number" || session.updatedAt <= 0) return true;
			return now - session.updatedAt > staleMs;
		}
		/**
		* The sidebar-faithful flat order: workspaces in Host display order, their
		* sessions with pinned ones leading followed by recency order (matching WorkspaceBrowser),
		* then unaccounted sessions trailing. This is the exact visual order the left
		* sidebar shows, so Ctrl+[ / Ctrl+] move up/down the list the user sees on the left.
		*/
		function sidebarOrder(sessionsSnap, workspacesSnap, options) {
			const ids = sessionsSnap.ids ?? [];
			const byId = sessionsSnap.byId ?? {};
			const workspaceItems = workspacesSnap.items ?? [];
			const archivedIds = new Set(workspacesSnap.archivedSessionIds ?? []);
			const pinnedIds = new Set(workspacesSnap.pinnedSessionIds ?? []);
			const currentId = options?.currentId ?? currentSessionId(sessionsSnap);
			const entries = [];
			const accounted = /* @__PURE__ */ new Set();
			for (const workspace of workspaceItems) {
				const pinnedMembers = [];
				const normalMembers = [];
				for (const id of workspace.sessionIds) {
					const session = byId[id];
					if (session === void 0) continue;
					accounted.add(id);
					if (!sessionVisible(session, currentId, archivedIds)) continue;
					const item = {
						session,
						workspace
					};
					if (pinnedIds.has(id)) pinnedMembers.push(item);
					else normalMembers.push(item);
				}
				pinnedMembers.sort((a, b) => byRecency(a.session, b.session));
				normalMembers.sort((a, b) => byRecency(a.session, b.session));
				entries.push(...pinnedMembers, ...normalMembers);
			}
			const pinnedStray = [];
			const normalStray = [];
			for (const id of ids) {
				const session = byId[id];
				if (session === void 0 || accounted.has(id)) continue;
				if (!sessionVisible(session, currentId, archivedIds)) continue;
				const item = { session };
				if (pinnedIds.has(id)) pinnedStray.push(item);
				else normalStray.push(item);
			}
			pinnedStray.sort((a, b) => byRecency(a.session, b.session));
			normalStray.sort((a, b) => byRecency(a.session, b.session));
			entries.push(...pinnedStray, ...normalStray);
			return entries;
		}
		/**
		* Return all visible pinned sessions across all workspaces in order.
		*/
		function pinnedSessions(sessionsSnap, workspacesSnap, options) {
			const ids = workspacesSnap.pinnedSessionIds ?? [];
			if (ids.length === 0) return [];
			const byId = sessionsSnap.byId ?? {};
			const workspaceItems = workspacesSnap.items ?? [];
			const archivedIds = new Set(workspacesSnap.archivedSessionIds ?? []);
			const currentId = options?.currentId ?? currentSessionId(sessionsSnap);
			const sessionWorkspaceMap = /* @__PURE__ */ new Map();
			for (const ws of workspaceItems) for (const sid of ws.sessionIds) sessionWorkspaceMap.set(sid, ws);
			const entries = [];
			for (const id of ids) {
				const session = byId[id];
				if (session === void 0) continue;
				if (!sessionVisible(session, currentId, archivedIds)) continue;
				entries.push({
					session,
					workspace: sessionWorkspaceMap.get(id)
				});
			}
			return entries;
		}
		/**
		* Global recency order (newest first, id tiebreak): lists all visible sessions
		* sorted strictly by their updatedAt timestamp regardless of workspace boundaries.
		* This puts the most recently active sessions right at the top for instant switching.
		*/
		function recencyOrder(sessionsSnap, workspacesSnap, options) {
			const ids = sessionsSnap.ids ?? [];
			const byId = sessionsSnap.byId ?? {};
			const workspaceItems = workspacesSnap.items ?? [];
			const archivedIds = new Set(workspacesSnap.archivedSessionIds ?? []);
			const currentId = options?.currentId ?? currentSessionId(sessionsSnap);
			const sessionWorkspaceMap = /* @__PURE__ */ new Map();
			for (const ws of workspaceItems) for (const sid of ws.sessionIds) sessionWorkspaceMap.set(sid, ws);
			const entries = [];
			for (const id of ids) {
				const session = byId[id];
				if (session === void 0) continue;
				if (!sessionVisible(session, currentId, archivedIds)) continue;
				entries.push({
					session,
					workspace: sessionWorkspaceMap.get(id)
				});
			}
			entries.sort((a, b) => byRecency(a.session, b.session));
			return entries;
		}
		/** Key for the ungrouped bucket in the palette item list. */
		const UNGROUPED_KEY = "__ungrouped__";
		/**
		* The row-only index of a session in a palette list (headers and folded rows skipped),
		* or -1 when the session is absent or no id is given. This is the selection
		* position the palette's keyboard navigation uses.
		*/
		function rowIndexOf(items, sessionId) {
			if (sessionId === void 0) return -1;
			let row = 0;
			for (const item of items) {
				if (item.kind !== "row") continue;
				if (item.session.id === sessionId) return row;
				row += 1;
			}
			return -1;
		}
		/**
		* The palette list: in management mode, sessions grouped under workspace
		* section headers (sidebar layout); empty sections are skipped. The flat
		* form feeds search and the quick switch view. Supports automatic hiding
		* of older/inactive sessions.
		*/
		function paletteItems(sessionsSnap, workspacesSnap, view, options) {
			const curId = options?.currentId ?? currentSessionId(sessionsSnap);
			const baseList = (options?.sort ?? (view === "flat" ? "sidebar" : "sidebar")) === "recency" ? recencyOrder(sessionsSnap, workspacesSnap, { currentId: curId }) : sidebarOrder(sessionsSnap, workspacesSnap, { currentId: curId });
			const hideStale = options?.hideStale === true;
			const expandedGroups = options?.expandedGroups;
			const pinnedIds = options?.pinnedIds ?? new Set(workspacesSnap.pinnedSessionIds ?? []);
			const effectiveOptions = {
				...options,
				pinnedIds
			};
			if (view === "flat") {
				if (!hideStale) return baseList.map((row) => ({
					kind: "row",
					...row
				}));
				const activeRows = [];
				const staleRows = [];
				for (const row of baseList) if (isStaleSession(row.session, effectiveOptions)) staleRows.push({
					kind: "row",
					session: row.session,
					workspace: row.workspace,
					stale: true
				});
				else activeRows.push({
					kind: "row",
					session: row.session,
					workspace: row.workspace,
					stale: false
				});
				if (staleRows.length === 0) return activeRows;
				const strings = switcherStrings();
				if (expandedGroups?.has("__all__") === true) return [
					...activeRows,
					...staleRows,
					{
						kind: "folded",
						key: "folded-__all__",
						groupKey: "__all__",
						count: staleRows.length,
						label: strings.collapseShownOlder(staleRows.length),
						expanded: true
					}
				];
				return [...activeRows, {
					kind: "folded",
					key: "folded-__all__",
					groupKey: "__all__",
					count: staleRows.length,
					label: strings.hiddenOlder(staleRows.length),
					expanded: false
				}];
			}
			const workspaceItems = workspacesSnap.items ?? [];
			const byWorkspace = /* @__PURE__ */ new Map();
			const stray = [];
			for (const row of baseList) {
				const key = row.workspace?.workspaceId;
				const stale = hideStale ? isStaleSession(row.session, effectiveOptions) : false;
				const item = {
					kind: "row",
					session: row.session,
					workspace: row.workspace,
					stale
				};
				if (key === void 0) stray.push(item);
				else {
					const bucket = byWorkspace.get(key);
					if (bucket === void 0) byWorkspace.set(key, [item]);
					else bucket.push(item);
				}
			}
			const items = [];
			const appendSection = (groupKey, label, rows) => {
				if (rows.length === 0) return;
				if (!hideStale) {
					items.push({
						kind: "header",
						key: groupKey,
						label,
						count: rows.length
					});
					items.push(...rows);
					return;
				}
				const active = rows.filter((r) => !r.stale);
				const stale = rows.filter((r) => r.stale);
				const isExpanded = expandedGroups?.has(groupKey) === true;
				items.push({
					kind: "header",
					key: groupKey,
					label,
					count: rows.length
				});
				if (isExpanded || stale.length === 0) {
					items.push(...rows);
					if (stale.length > 0) items.push({
						kind: "folded",
						key: `folded-${groupKey}`,
						groupKey,
						count: stale.length,
						label: switcherStrings().collapseShownOlder(stale.length),
						expanded: true
					});
				} else {
					items.push(...active);
					items.push({
						kind: "folded",
						key: `folded-${groupKey}`,
						groupKey,
						count: stale.length,
						label: switcherStrings().hiddenOlder(stale.length),
						expanded: false
					});
				}
			};
			for (const workspace of workspaceItems) {
				const rows = byWorkspace.get(workspace.workspaceId);
				if (rows !== void 0) appendSection(workspace.workspaceId, workspace.title, rows);
			}
			if (stray.length > 0) appendSection(UNGROUPED_KEY, switcherStrings().ungrouped, stray);
			return items;
		}
		/**
		* Archived (non-subagent) sessions for the archived view, recency order.
		* The sidebar hides archived rows everywhere, so this list is flat. Each
		* entry carries its owning workspace when one exists: archiving never
		* touches workspace accounting (the host keeps the `sessionIds` slot), so
		* the pre-archive group is still derivable from the workspace items; only
		* sessions no workspace ever claimed stay ungrouped.
		*/
		function archivedSessions(sessionsSnap, workspacesSnap) {
			const byId = sessionsSnap.byId ?? {};
			const workspaceItems = workspacesSnap.items ?? [];
			const archivedIds = new Set(workspacesSnap.archivedSessionIds ?? []);
			const entries = [];
			for (const id of sessionsSnap.ids ?? []) {
				const session = byId[id];
				if (session === void 0 || session.origin === "subagent") continue;
				if (!archivedIds.has(id)) continue;
				const workspace = workspaceItems.find((w) => w.sessionIds.includes(id));
				entries.push(workspace === void 0 ? { session } : {
					session,
					workspace
				});
			}
			entries.sort((a, b) => byRecency(a.session, b.session));
			return entries;
		}
		/**
		* The cycle-gesture anchor: the current session id when it is itself in the
		* list (forked/branch conversations are list rows), otherwise — e.g. a
		* subagent child that lives under its parent's catalog — the nearest
		* ancestor that is in the list, so Ctrl+[ / Ctrl+] move relative to the row
		* the sidebar highlights.
		*/
		function cycleAnchor(entries, currentId, byId) {
			if (currentId !== void 0 && entries.some((entry) => entry.session.id === currentId)) return currentId;
			return cycleAnchorId(currentId, byId);
		}
		/** Walk subagent lineage up to the root ancestor of a session. */
		function cycleAnchorId(currentId, byId) {
			let id = currentId;
			while (id !== void 0) {
				const session = byId[id];
				if (session === void 0) break;
				if (session.parentId === void 0) return session.id;
				id = session.parentId;
			}
		}
		/**
		* The conversation `offset` positions away from the anchor, wrapping around.
		* A missing anchor lands on the first (positive) or last (negative) entry.
		*/
		function offsetTarget(entries, anchorId, offset) {
			if (entries.length === 0) return void 0;
			const index = entries.findIndex((e) => e.session.id === anchorId);
			if (index === -1) return offset > 0 ? entries[0] : entries[entries.length - 1];
			return entries[(index + offset + entries.length) % entries.length];
		}
		//#endregion
		//#region src/client/skins.ts
		/**
		* Palette skins (深色/浅色/高对比). The color values live as CSS custom
		* properties in switcher.module.css (one `[data-skin=…]` block each); this
		* module only owns the name order and the localStorage persistence; the
		* display labels live in the locale dictionaries (i18n.ts). Flipping the `data-skin` attribute restyles the whole palette.
		* @module @suxeca/dsh-client-ui-session-switcher/client/skins
		*/
		/** Skin cycle order (the header button steps through it). */
		const SKIN_ORDER = [
			"dark",
			"light",
			"highcontrast"
		];
		/** localStorage key backing the persisted skin choice. */
		const SKIN_KEY = "dsh.sessionSwitcher.skin";
		/** Type guard: is this a known skin name? */
		function isSkinName(value) {
			return typeof value === "string" && SKIN_ORDER.includes(value);
		}
		/** Read the persisted skin, defaulting to dark on absence/corruption. */
		function loadSkin() {
			try {
				const value = localStorage.getItem(SKIN_KEY);
				return isSkinName(value) ? value : "dark";
			} catch {
				return "dark";
			}
		}
		/** Persist the skin choice (storage failures are ignored). */
		function saveSkin(name) {
			try {
				localStorage.setItem(SKIN_KEY, name);
			} catch {}
		}
		/** The next skin in the cycle order. */
		function nextSkin(name) {
			return SKIN_ORDER[(SKIN_ORDER.indexOf(name) + 1) % SKIN_ORDER.length];
		}
		//#endregion
		//#region \0dsh-css:/home/evgen/nixos-config/tmp/dsh-plugin-i18n/packages/dsh-client-ui-session-switcher/src/client/switcher.module.css.mjs
		const css = ".KIvkMa_root[data-skin=dark]{--sw-overlay:#0000008c;--sw-card:#1b1b20;--sw-card-border:#ffffff2e;--sw-text:#f2f2f5;--sw-dim:#a6a6ae;--sw-input-bg:#ffffff0f;--sw-input-border:#ffffff24;--sw-hover:#ffffff14;--sw-selected:#6366f161;--sw-accent:#6366f1;--sw-accent-text:#fff;--sw-danger:#f0abab;--sw-danger-border:#f0787880;--sw-tag-border:#ffffff38;--sw-kbd-bg:#ffffff1a;--sw-error:#ff7b7b;--sw-ws0-bg:#6366f133;--sw-ws0-border:#818cf873;--sw-ws0-text:#c7d2fe;--sw-ws1-bg:#f59e0b33;--sw-ws1-border:#fbbf2473;--sw-ws1-text:#fde68a;--sw-ws2-bg:#a855f733;--sw-ws2-border:#c084fc73;--sw-ws2-text:#e9d5ff;--sw-ws3-bg:#06b6d433;--sw-ws3-border:#22d3ee73;--sw-ws3-text:#a5f3fc;--sw-ws4-bg:#f43f5e33;--sw-ws4-border:#fb718573;--sw-ws4-text:#fecdd3;--sw-ws5-bg:#14b8a633;--sw-ws5-border:#2dd4bf73;--sw-ws5-text:#99f6e4;--sw-ws6-bg:#ef444433;--sw-ws6-border:#f8717173;--sw-ws6-text:#fecaca;--sw-ws7-bg:#8b5cf633;--sw-ws7-border:#a78bfa73;--sw-ws7-text:#ddd6fe;--sw-ws-none-bg:#ffffff14;--sw-ws-none-border:#ffffff2e;--sw-ws-none-text:#cbd5e1;--sw-time-l0:#34d399;--sw-time-l1:#4ade80;--sw-time-l2:#86efac;--sw-time-l3:#a3e635;--sw-time-l4:#cbd5e1;--sw-time-l5:#94a3b8}.KIvkMa_root[data-skin=light]{--sw-overlay:#00000059;--sw-card:#fff;--sw-card-border:#00000029;--sw-text:#1c1c22;--sw-dim:#5f5f68;--sw-input-bg:#0000000a;--sw-input-border:#0000001f;--sw-hover:#0000000d;--sw-selected:#4f46e529;--sw-accent:#4f46e5;--sw-accent-text:#fff;--sw-danger:#b5341f;--sw-danger-border:#b5341f73;--sw-tag-border:#0003;--sw-kbd-bg:#0000000f;--sw-error:#c62828;--sw-ws0-bg:#e0e7ff;--sw-ws0-border:#a5b4fc;--sw-ws0-text:#3730a3;--sw-ws1-bg:#fef3c7;--sw-ws1-border:#fcd34d;--sw-ws1-text:#92400e;--sw-ws2-bg:#f3e8ff;--sw-ws2-border:#d8b4fe;--sw-ws2-text:#6b21a8;--sw-ws3-bg:#cffafe;--sw-ws3-border:#67e8f9;--sw-ws3-text:#155e75;--sw-ws4-bg:#ffe4e6;--sw-ws4-border:#fda4af;--sw-ws4-text:#9f1239;--sw-ws5-bg:#ccfbf1;--sw-ws5-border:#5eead4;--sw-ws5-text:#115e59;--sw-ws6-bg:#fee2e2;--sw-ws6-border:#fca5a5;--sw-ws6-text:#991b1b;--sw-ws7-bg:#ede9fe;--sw-ws7-border:#c4b5fd;--sw-ws7-text:#5b21b6;--sw-ws-none-bg:#f1f5f9;--sw-ws-none-border:#cbd5e1;--sw-ws-none-text:#475569;--sw-time-l0:#059669;--sw-time-l1:#16a34a;--sw-time-l2:#15803d;--sw-time-l3:#4d7c0f;--sw-time-l4:#64748b;--sw-time-l5:#94a3b8}.KIvkMa_root[data-skin=highcontrast]{--sw-overlay:#000000b3;--sw-card:#0f0f13;--sw-card-border:#fff;--sw-text:#fff;--sw-dim:#c9c9d2;--sw-input-bg:#1d1d24;--sw-input-border:#fff;--sw-hover:#27272f;--sw-selected:#4f46e5;--sw-accent:#818cf8;--sw-accent-text:#fff;--sw-danger:#ff9d9d;--sw-danger-border:#ff6b6b;--sw-tag-border:#fff;--sw-kbd-bg:#2c2c35;--sw-error:#ff8080;--sw-ws0-bg:#003;--sw-ws0-border:#818cf8;--sw-ws0-text:#c7d2fe;--sw-ws1-bg:#320;--sw-ws1-border:#fbbf24;--sw-ws1-text:#fde68a;--sw-ws2-bg:#2b0033;--sw-ws2-border:#c084fc;--sw-ws2-text:#e9d5ff;--sw-ws3-bg:#002b33;--sw-ws3-border:#22d3ee;--sw-ws3-text:#a5f3fc;--sw-ws4-bg:#301;--sw-ws4-border:#fb7185;--sw-ws4-text:#fecdd3;--sw-ws5-bg:#00332b;--sw-ws5-border:#2dd4bf;--sw-ws5-text:#99f6e4;--sw-ws6-bg:#330505;--sw-ws6-border:#f87171;--sw-ws6-text:#fecaca;--sw-ws7-bg:#1c0033;--sw-ws7-border:#a78bfa;--sw-ws7-text:#ddd6fe;--sw-ws-none-bg:#1e293b;--sw-ws-none-border:#64748b;--sw-ws-none-text:#fff;--sw-time-l0:#10b981;--sw-time-l1:#22c55e;--sw-time-l2:#4ade80;--sw-time-l3:#a3e635;--sw-time-l4:#e2e8f0;--sw-time-l5:#94a3b8}.KIvkMa_root{font-family:system-ui,-apple-system,Segoe UI,PingFang SC,Microsoft YaHei,sans-serif}.KIvkMa_wrapper{pointer-events:none;z-index:998;position:fixed;inset:0}.KIvkMa_toast{z-index:1000;background:var(--sw-accent);color:var(--sw-accent-text);cursor:pointer;pointer-events:auto;border-radius:10px;padding:10px 18px;font-size:13px;position:fixed;top:16px;left:50%;transform:translate(-50%);box-shadow:0 6px 20px #00000073}.KIvkMa_overlay{z-index:2147483000;background:var(--sw-overlay);justify-content:center;align-items:flex-start;padding-top:12vh;display:flex;position:fixed;inset:0}.KIvkMa_card{background:var(--sw-card);border:1px solid var(--sw-card-border);width:min(620px,100vw - 32px);max-height:min(560px,70vh);color:var(--sw-text);border-radius:12px;outline:none;flex-direction:column;font-size:14px;display:flex;overflow:hidden;box-shadow:0 16px 48px #00000073}.KIvkMa_header{align-items:center;gap:8px;padding:12px 14px 8px;display:flex}.KIvkMa_title{color:var(--sw-dim);letter-spacing:.02em;font-size:13px;font-weight:600}.KIvkMa_modeTag{border:1px solid var(--sw-accent);color:var(--sw-accent);border-radius:999px;padding:1px 8px;font-size:11px}.KIvkMa_newButton{border:1px solid var(--sw-card-border);background:var(--sw-hover);color:var(--sw-text);cursor:pointer;border-radius:8px;margin-left:auto;padding:4px 10px;font-size:12px}.KIvkMa_skinButton{border:1px solid var(--sw-card-border);background:var(--sw-hover);color:var(--sw-dim);cursor:pointer;border-radius:8px;padding:4px 10px;font-size:12px;transition:all .15s}.KIvkMa_activeButton{border-color:var(--sw-accent);color:var(--sw-accent);background:var(--sw-selected)}.KIvkMa_input{box-sizing:border-box;border:none;border-top:1px solid var(--sw-input-border);border-bottom:1px solid var(--sw-input-border);background:var(--sw-input-bg);width:100%;color:var(--sw-text);outline:none;padding:8px 14px;font-size:14px}.KIvkMa_searchStrip{box-sizing:border-box;border:none;border-top:1px solid var(--sw-input-border);border-bottom:1px solid var(--sw-input-border);background:var(--sw-input-bg);width:100%;color:var(--sw-dim);text-align:left;cursor:pointer;padding:9px 14px;font-size:13px}.KIvkMa_renameBar{box-sizing:border-box;border-top:1px solid var(--sw-input-border);border-bottom:1px solid var(--sw-input-border);background:var(--sw-input-bg);align-items:center;gap:8px;width:100%;padding:6px 14px;display:flex}.KIvkMa_renameInput{min-width:0;color:var(--sw-text);background:0 0;border:none;outline:none;flex:1;font-size:13.5px}.KIvkMa_list{flex:1;min-height:60px;padding:6px;overflow-y:auto}.KIvkMa_groupHeader{color:var(--sw-dim);letter-spacing:.03em;user-select:none;align-items:center;gap:8px;padding:10px 10px 4px;font-size:11.5px;display:flex}.KIvkMa_groupDot{border-radius:50%;flex-shrink:0;width:7px;height:7px}.KIvkMa_groupLabel{white-space:nowrap;text-overflow:ellipsis;font-weight:600;overflow:hidden}.KIvkMa_groupCount{border:1px solid var(--sw-tag-border);color:var(--sw-dim);border-radius:999px;flex-shrink:0;padding:0 6px;font-size:10.5px;line-height:15px}.KIvkMa_row{cursor:pointer;border-radius:8px;align-items:center;gap:10px;padding:8px 10px;transition:background .12s;display:flex}.KIvkMa_rowSelected{background:var(--sw-selected)}.KIvkMa_dot{background:var(--sw-accent);border-radius:50%;flex-shrink:0;width:8px;height:8px}.KIvkMa_dotIdle{background:var(--sw-dim)}.KIvkMa_main{flex:1;min-width:0}.KIvkMa_rowTitle{white-space:nowrap;text-overflow:ellipsis;color:var(--sw-text);font-size:13.5px;font-weight:450;overflow:hidden}.KIvkMa_rowMeta{color:var(--sw-dim);flex-wrap:wrap;align-items:center;gap:6px;margin-top:3px;font-size:11.5px;display:flex}.KIvkMa_metaItem{color:var(--sw-dim)}.KIvkMa_metaDivider{color:var(--sw-dim);opacity:.4;user-select:none}.KIvkMa_wsTag{text-overflow:ellipsis;white-space:nowrap;vertical-align:middle;border-style:solid;border-width:1px;border-radius:4px;align-items:center;max-width:140px;padding:1px 7px;font-size:11px;font-weight:550;line-height:15px;display:inline-flex;overflow:hidden}.KIvkMa_wsTagUngrouped{background:var(--sw-ws-none-bg);border-color:var(--sw-ws-none-border);color:var(--sw-ws-none-text)}.KIvkMa_root[data-skin=dark] .KIvkMa_wsTagColored{background:hsla(var(--ws-h), 75%, 55%, .18);border-color:hsla(var(--ws-h), 75%, 65%, .45);color:hsl(var(--ws-h), 90%, 82%)}.KIvkMa_root[data-skin=light] .KIvkMa_wsTagColored{background:hsl(var(--ws-h), 90%, 93%);border-color:hsl(var(--ws-h), 75%, 75%);color:hsl(var(--ws-h), 85%, 28%)}.KIvkMa_root[data-skin=highcontrast] .KIvkMa_wsTagColored{background:hsl(var(--ws-h), 95%, 12%);border-color:hsl(var(--ws-h), 95%, 65%);color:hsl(var(--ws-h), 100%, 88%)}.KIvkMa_wsTag_0{background:var(--sw-ws0-bg);border-color:var(--sw-ws0-border);color:var(--sw-ws0-text)}.KIvkMa_wsTag_1{background:var(--sw-ws1-bg);border-color:var(--sw-ws1-border);color:var(--sw-ws1-text)}.KIvkMa_wsTag_2{background:var(--sw-ws2-bg);border-color:var(--sw-ws2-border);color:var(--sw-ws2-text)}.KIvkMa_wsTag_3{background:var(--sw-ws3-bg);border-color:var(--sw-ws3-border);color:var(--sw-ws3-text)}.KIvkMa_wsTag_4{background:var(--sw-ws4-bg);border-color:var(--sw-ws4-border);color:var(--sw-ws4-text)}.KIvkMa_wsTag_5{background:var(--sw-ws5-bg);border-color:var(--sw-ws5-border);color:var(--sw-ws5-text)}.KIvkMa_wsTag_6{background:var(--sw-ws6-bg);border-color:var(--sw-ws6-border);color:var(--sw-ws6-text)}.KIvkMa_wsTag_7{background:var(--sw-ws7-bg);border-color:var(--sw-ws7-border);color:var(--sw-ws7-text)}.KIvkMa_wsTag_neg1{background:var(--sw-ws-none-bg);border-color:var(--sw-ws-none-border);color:var(--sw-ws-none-text)}.KIvkMa_timeBadge{white-space:nowrap;align-items:center;gap:4px;font-size:11.5px;display:inline-flex}.KIvkMa_timeL0{color:var(--sw-time-l0);font-weight:600}.KIvkMa_timeL1{color:var(--sw-time-l1);font-weight:600}.KIvkMa_timeL2{color:var(--sw-time-l2);font-weight:500}.KIvkMa_timeL3{color:var(--sw-time-l3);font-weight:500}.KIvkMa_timeL4{color:var(--sw-time-l4)}.KIvkMa_timeL5{color:var(--sw-time-l5)}.KIvkMa_liveDot{background-color:currentColor;border-radius:50%;flex-shrink:0;width:5px;height:5px;display:inline-block;box-shadow:0 0 5px}.KIvkMa_tag{border:1px solid var(--sw-tag-border);color:var(--sw-dim);border-radius:999px;flex-shrink:0;padding:1px 7px;font-size:11px}.KIvkMa_tagCurrent{border-color:var(--sw-accent);color:var(--sw-accent)}.KIvkMa_tagPinned{color:#f59e0b;background:#f59e0b1f;border-color:#f59e0b;font-weight:550}.KIvkMa_rowAction{border:1px solid var(--sw-card-border);background:var(--sw-hover);color:var(--sw-dim);cursor:pointer;border-radius:6px;flex-shrink:0;padding:2px 8px;font-size:11px;transition:all .12s}.KIvkMa_rowAction:hover{color:var(--sw-text);border-color:var(--sw-accent)}.KIvkMa_row:hover .KIvkMa_rowAction,.KIvkMa_rowSelected .KIvkMa_rowAction{color:var(--sw-text)}.KIvkMa_rowActionDanger{color:var(--sw-danger);border-color:var(--sw-danger-border)}.KIvkMa_foldedRow{background:var(--sw-hover);color:var(--sw-dim);cursor:pointer;user-select:none;border:1px dashed var(--sw-input-border);border-radius:6px;align-items:center;gap:8px;margin:4px 6px;padding:6px 12px;font-size:12px;transition:background .15s,color .15s,border-color .15s;display:flex}.KIvkMa_foldedRow:hover{background:var(--sw-selected);color:var(--sw-text);border-color:var(--sw-accent)}.KIvkMa_foldedIcon{opacity:.8;flex-shrink:0;font-size:10px}.KIvkMa_foldedLabel{flex:1}.KIvkMa_empty{text-align:center;color:var(--sw-dim);padding:26px 14px;font-size:13px}.KIvkMa_settings{flex:1;padding:10px 14px;overflow-y:auto}.KIvkMa_officialShortcutsBar{margin-bottom:12px}.KIvkMa_officialShortcutsBtn{border:1px solid var(--sw-accent);background:var(--sw-selected);width:100%;color:var(--sw-text);cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:8px 12px;font-size:13px;font-weight:550;transition:all .15s;display:flex}.KIvkMa_officialShortcutsBtn:hover{background:var(--sw-accent);color:var(--sw-accent-text);box-shadow:0 2px 10px #6366f159}.KIvkMa_settingsHint{color:var(--sw-dim);margin-bottom:10px;font-size:12px;line-height:1.5}.KIvkMa_settingsRow{border-bottom:1px solid var(--sw-input-border);align-items:center;gap:10px;padding:8px 4px;display:flex}.KIvkMa_settingsRow:last-child{border-bottom:none}.KIvkMa_settingsLabel{min-width:0;color:var(--sw-text);flex:1;font-size:13.5px}.KIvkMa_captureHint{color:var(--sw-accent);font-size:12.5px}.KIvkMa_footer{border-top:1px solid var(--sw-input-border);color:var(--sw-dim);flex-wrap:wrap;align-items:center;gap:4px 10px;padding:8px 14px 10px;font-size:11.5px;display:flex}.KIvkMa_footerAction{align-items:center;display:inline-flex}.KIvkMa_footerPush{margin-left:auto}.KIvkMa_errorLine{color:var(--sw-error);background:#c6282814;padding:6px 14px;font-size:12px}.KIvkMa_kbd{background:var(--sw-kbd-bg);border:1px solid var(--sw-card-border);color:var(--sw-dim);border-radius:4px;margin-left:4px;padding:1px 6px;font-family:inherit;font-size:11px;line-height:16px;display:inline-block}";
		const tagId = "@suxeca/dsh-client-ui-session-switcher/switcher.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@suxeca/dsh-client-ui-session-switcher";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var switcher_module_css_default = {
			"activeButton": "KIvkMa_activeButton",
			"captureHint": "KIvkMa_captureHint",
			"card": "KIvkMa_card",
			"dot": "KIvkMa_dot",
			"dotIdle": "KIvkMa_dotIdle",
			"empty": "KIvkMa_empty",
			"errorLine": "KIvkMa_errorLine",
			"foldedIcon": "KIvkMa_foldedIcon",
			"foldedLabel": "KIvkMa_foldedLabel",
			"foldedRow": "KIvkMa_foldedRow",
			"footer": "KIvkMa_footer",
			"footerAction": "KIvkMa_footerAction",
			"footerPush": "KIvkMa_footerPush",
			"groupCount": "KIvkMa_groupCount",
			"groupDot": "KIvkMa_groupDot",
			"groupHeader": "KIvkMa_groupHeader",
			"groupLabel": "KIvkMa_groupLabel",
			"header": "KIvkMa_header",
			"input": "KIvkMa_input",
			"kbd": "KIvkMa_kbd",
			"list": "KIvkMa_list",
			"liveDot": "KIvkMa_liveDot",
			"main": "KIvkMa_main",
			"metaDivider": "KIvkMa_metaDivider",
			"metaItem": "KIvkMa_metaItem",
			"modeTag": "KIvkMa_modeTag",
			"newButton": "KIvkMa_newButton",
			"officialShortcutsBar": "KIvkMa_officialShortcutsBar",
			"officialShortcutsBtn": "KIvkMa_officialShortcutsBtn",
			"overlay": "KIvkMa_overlay",
			"renameBar": "KIvkMa_renameBar",
			"renameInput": "KIvkMa_renameInput",
			"root": "KIvkMa_root",
			"row": "KIvkMa_row",
			"rowAction": "KIvkMa_rowAction",
			"rowActionDanger": "KIvkMa_rowActionDanger",
			"rowMeta": "KIvkMa_rowMeta",
			"rowSelected": "KIvkMa_rowSelected",
			"rowTitle": "KIvkMa_rowTitle",
			"searchStrip": "KIvkMa_searchStrip",
			"settings": "KIvkMa_settings",
			"settingsHint": "KIvkMa_settingsHint",
			"settingsLabel": "KIvkMa_settingsLabel",
			"settingsRow": "KIvkMa_settingsRow",
			"skinButton": "KIvkMa_skinButton",
			"tag": "KIvkMa_tag",
			"tagCurrent": "KIvkMa_tagCurrent",
			"tagPinned": "KIvkMa_tagPinned",
			"timeBadge": "KIvkMa_timeBadge",
			"timeL0": "KIvkMa_timeL0",
			"timeL1": "KIvkMa_timeL1",
			"timeL2": "KIvkMa_timeL2",
			"timeL3": "KIvkMa_timeL3",
			"timeL4": "KIvkMa_timeL4",
			"timeL5": "KIvkMa_timeL5",
			"title": "KIvkMa_title",
			"toast": "KIvkMa_toast",
			"wrapper": "KIvkMa_wrapper",
			"wsTag": "KIvkMa_wsTag",
			"wsTagColored": "KIvkMa_wsTagColored",
			"wsTagUngrouped": "KIvkMa_wsTagUngrouped",
			"wsTag_0": "KIvkMa_wsTag_0",
			"wsTag_1": "KIvkMa_wsTag_1",
			"wsTag_2": "KIvkMa_wsTag_2",
			"wsTag_3": "KIvkMa_wsTag_3",
			"wsTag_4": "KIvkMa_wsTag_4",
			"wsTag_5": "KIvkMa_wsTag_5",
			"wsTag_6": "KIvkMa_wsTag_6",
			"wsTag_7": "KIvkMa_wsTag_7",
			"wsTag_neg1": "KIvkMa_wsTag_neg1"
		};
		//#endregion
		//#region src/client/switcher.tsx
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
		/** localStorage flag recording the one-time readiness-toast dismissal. */
		const TOAST_KEY = "dsh.sessionSwitcher.toastSeen";
		/** localStorage flag recording whether older/inactive sessions are hidden by default. */
		const HIDE_OLD_KEY = "dsh.sessionSwitcher.hideInactive";
		/** Inline keyboard hint chip. */
		function Kbd({ children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("kbd", {
				className: switcher_module_css_default.kbd,
				children
			});
		}
		/**
		* The palette component. Both render branches carry the skin attribute on
		* their root so the toast (closed) and the card (open) share one variable
		* palette.
		*/
		function Switcher({ ctx, openStore, keymapStore }) {
			const palette = (0, react.useSyncExternalStore)(openStore.subscribe, openStore.getSnapshot);
			const open = palette.open;
			const sessionsSnap = (0, react.useSyncExternalStore)((listener) => ctx.sessions.list.subscribe(listener), () => ctx.sessions.list.getSnapshot());
			const workspacesSnap = (0, react.useSyncExternalStore)((listener) => ctx.workspaces.list.subscribe(listener), () => ctx.workspaces.list.getSnapshot());
			const keymap = (0, react.useSyncExternalStore)(keymapStore.subscribe, keymapStore.getSnapshot);
			const strings = useSwitcherStrings();
			const [query, setQuery] = (0, react.useState)("");
			/** Selection position within the row-only subsequence (headers are skipped). */
			const [index, setIndex] = (0, react.useState)(0);
			const [showArchived, setShowArchived] = (0, react.useState)(false);
			const [searching, setSearching] = (0, react.useState)(false);
			const [renameId, setRenameId] = (0, react.useState)(null);
			const [renameDraft, setRenameDraft] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(null);
			const [showReadyToast, setShowReadyToast] = (0, react.useState)(() => {
				try {
					return localStorage.getItem(TOAST_KEY) !== "1";
				} catch {
					return true;
				}
			});
			const [skinName, setSkinName] = (0, react.useState)(loadSkin);
			const [configuring, setConfiguring] = (0, react.useState)(false);
			const [captureAction, setCaptureAction] = (0, react.useState)(null);
			const [hideOldSessions, setHideOldSessions] = (0, react.useState)(() => {
				try {
					return localStorage.getItem(HIDE_OLD_KEY) !== "0";
				} catch {
					return true;
				}
			});
			const [expandedGroups, setExpandedGroups] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const inputRef = (0, react.useRef)(null);
			const renameRef = (0, react.useRef)(null);
			const cardRef = (0, react.useRef)(null);
			const listRef = (0, react.useRef)(null);
			const toggleHideOldSessions = () => {
				setHideOldSessions((v) => {
					const next = !v;
					try {
						localStorage.setItem(HIDE_OLD_KEY, next ? "1" : "0");
					} catch {}
					return next;
				});
			};
			const toggleGroupExpand = (groupKey) => {
				setExpandedGroups((prev) => {
					const next = new Set(prev);
					if (next.has(groupKey)) next.delete(groupKey);
					else next.add(groupKey);
					return next;
				});
			};
			const jumpToPinnedRow = () => {
				const pinnedIdx = items.findIndex((it) => it.kind === "row" && pinnedSet.has(it.session.id));
				if (pinnedIdx !== -1) {
					const rowIdx = rowPositions.indexOf(pinnedIdx);
					if (rowIdx !== -1) setIndex(rowIdx);
				}
			};
			(0, react.useEffect)(() => {
				if (!showReadyToast) return;
				const timer = setTimeout(() => setShowReadyToast(false), 8e3);
				return () => clearTimeout(timer);
			}, [showReadyToast]);
			const dismissToast = () => {
				setShowReadyToast(false);
				try {
					localStorage.setItem(TOAST_KEY, "1");
				} catch {}
			};
			(0, react.useEffect)(() => {
				if (error === null) return;
				const timer = setTimeout(() => setError(null), 4e3);
				return () => clearTimeout(timer);
			}, [error]);
			const workspaceItems = workspacesSnap.items ?? [];
			const archivedIds = workspacesSnap.archivedSessionIds ?? [];
			const archivedSet = (0, react.useMemo)(() => new Set(archivedIds), [archivedIds]);
			const pinnedIds = workspacesSnap.pinnedSessionIds ?? [];
			const pinnedSet = (0, react.useMemo)(() => new Set(pinnedIds), [pinnedIds]);
			const currentId = (0, react.useMemo)(() => currentSessionId(sessionsSnap), [sessionsSnap]);
			/** The workspace owning the current session; falls back to the recent-workspace projection. */
			const currentWorkspaceId = (0, react.useMemo)(() => {
				if (currentId !== void 0) {
					const owner = workspaceIdOwning(workspaceItems, currentId);
					if (owner !== void 0) return owner;
				}
				return workspacesSnap.recentWorkspaceId;
			}, [
				currentId,
				workspaceItems,
				workspacesSnap.recentWorkspaceId
			]);
			/** Sequential index map per workspace to guarantee every distinct workspace has a unique contrasting color. */
			const workspaceColorMap = (0, react.useMemo)(() => {
				const map = /* @__PURE__ */ new Map();
				let idx = 0;
				for (const w of workspaceItems) if (!map.has(w.workspaceId)) map.set(w.workspaceId, idx++);
				return map;
			}, [workspaceItems]);
			/**
			* The palette list.
			* Search mode presents conversations ordered globally by recency so recent
			* items appear immediately at the top without long scrolls. Older/inactive
			* sessions are folded into an expandable item when hideOldSessions is true
			* (non-empty queries automatically bypass folding to search all conversations).
			* Management mode groups conversations by workspace with section folding.
			*/
			const items = (0, react.useMemo)(() => {
				if (searching) {
					const q = query.trim().toLowerCase();
					return paletteItems(sessionsSnap, workspacesSnap, "flat", {
						sort: "recency",
						hideStale: q === "" ? hideOldSessions : false,
						currentId,
						expandedGroups
					}).filter((item) => item.kind === "folded" || item.kind === "row" && (q === "" || titleOf(item.session).toLowerCase().includes(q)));
				}
				if (showArchived) return archivedSessions(sessionsSnap, workspacesSnap).map((row) => ({
					kind: "row",
					...row
				}));
				return paletteItems(sessionsSnap, workspacesSnap, "grouped", {
					hideStale: hideOldSessions,
					currentId,
					expandedGroups
				});
			}, [
				sessionsSnap,
				workspacesSnap,
				searching,
				query,
				showArchived,
				hideOldSessions,
				expandedGroups,
				currentId
			]);
			/** Item positions holding a session row, in list order. */
			const rowPositions = (0, react.useMemo)(() => items.reduce((acc, item, pos) => {
				if (item.kind === "row") acc.push(pos);
				return acc;
			}, []), [items]);
			const selected = index < rowPositions.length ? items[rowPositions[index]] : null;
			(0, react.useEffect)(() => {
				if (!open) return;
				setQuery("");
				setShowArchived(false);
				setSearching(true);
				setRenameId(null);
				setError(null);
				setConfiguring(false);
				setCaptureAction(null);
				if (keymapStore.getSnapshot().capturing) keymapStore.endCapture();
				const rowIndex = rowIndexOf(paletteItems(sessionsSnap, workspacesSnap, "flat", {
					sort: "recency",
					hideStale: hideOldSessions,
					currentId,
					expandedGroups
				}), cycleAnchor(recencyOrder(sessionsSnap, workspacesSnap), currentId, sessionsSnap.byId));
				setIndex(rowIndex === -1 ? 0 : rowIndex);
				cardRef.current?.focus();
			}, [open]);
			(0, react.useEffect)(() => {
				if (searching) inputRef.current?.focus();
			}, [searching]);
			(0, react.useEffect)(() => {
				if (renameId !== null) renameRef.current?.focus();
			}, [renameId]);
			(0, react.useEffect)(() => {
				setIndex((i) => rowPositions.length === 0 ? 0 : Math.min(i, rowPositions.length - 1));
			}, [rowPositions.length]);
			(0, react.useEffect)(() => {
				if (!open) return;
				(listRef.current?.querySelector(`[data-row-index="${index}"]`))?.scrollIntoView({ block: "nearest" });
			}, [open, index]);
			const openSession = (sessionId) => {
				if (ctx.uiWorkspace?.openSession) ctx.uiWorkspace.openSession(sessionId);
				else if (ctx.sessions.open) ctx.sessions.open(sessionId);
				openStore.close();
			};
			/** Space-preview the selected conversation: switch to it WITHOUT leaving
			*  the palette interaction — Esc restores the previous session and returns
			*  to the card; Enter confirms the switch. Archived sessions work the same
			*  (sessions.open addresses them; only the sidebar hides them). */
			const startPreview = () => {
				if (selected === null) return;
				const fromId = currentId;
				openStore.enterPreview(selected.session.id, fromId);
				if (ctx.uiWorkspace?.openSession) ctx.uiWorkspace.openSession(selected.session.id);
				else if (ctx.sessions.open) ctx.sessions.open(selected.session.id);
			};
			const newConversation = () => {
				try {
					if (ctx.uiWorkspace?.startSession) ctx.uiWorkspace.startSession(currentWorkspaceId);
					else if (ctx.workspaces.startSession) ctx.workspaces.startSession(currentWorkspaceId);
					else throw new Error(strings.noNewSession);
				} catch (err) {
					setError(strings.newSessionFailed(err instanceof Error ? err.message : String(err)));
				}
				openStore.close();
			};
			const archiveSession = (sessionId) => {
				(ctx.uiWorkspace?.archiveSession ? ctx.uiWorkspace.archiveSession(sessionId) : ctx.workspaces.archiveSession(sessionId)).catch((err) => {
					setError(strings.archiveFailed(err instanceof Error ? err.message : String(err)));
				});
			};
			const unarchiveSession = (sessionId) => {
				(ctx.uiWorkspace?.unarchiveSession ? ctx.uiWorkspace.unarchiveSession(sessionId) : ctx.workspaces.unarchiveSession(sessionId)).catch((err) => {
					setError(strings.unarchiveFailed(err instanceof Error ? err.message : String(err)));
				});
			};
			const startRename = (sessionId) => {
				const entry = sessionsSnap.byId?.[sessionId];
				setRenameDraft(entry === void 0 ? "" : titleOf(entry));
				setRenameId(sessionId);
			};
			const cancelRename = () => {
				setRenameId(null);
				setRenameDraft("");
				cardRef.current?.focus();
			};
			const saveRename = async () => {
				const id = renameId;
				const title = renameDraft.trim();
				cancelRename();
				if (id === null || title === "") return;
				try {
					if (typeof ctx.sessions.using === "function") {
						const result = await ctx.sessions.using(id, { source: "controllerOperation" }, (ref) => ref.binding.session.rename(title));
						if (!result.ok) throw new Error(result.error?.message ?? strings.renameRejected);
					} else {
						const session = ctx.sessions.binding(id)?.session;
						if (session === void 0) throw new Error(strings.renameOffline);
						const result = await session.rename(title);
						if (!result.ok) throw new Error(result.error?.message ?? strings.renameRejected);
					}
				} catch (err) {
					setError(strings.renameFailed(err instanceof Error ? err.message : String(err)));
				}
			};
			const enterSearch = () => {
				setQuery("");
				setSearching(true);
			};
			const exitSearch = () => {
				setQuery("");
				setSearching(false);
				cardRef.current?.focus();
			};
			const cycleSkin = () => {
				const next = nextSkin(skinName);
				setSkinName(next);
				saveSkin(next);
			};
			const openSettings = () => {
				setConfiguring(true);
				setSearching(false);
				setQuery("");
				cardRef.current?.focus();
			};
			const closeSettings = () => {
				setConfiguring(false);
				setCaptureAction(null);
				cardRef.current?.focus();
			};
			const startCapture = (action) => {
				setCaptureAction(action);
				keymapStore.beginCapture();
				cardRef.current?.focus();
			};
			const cancelCapture = () => {
				setCaptureAction(null);
				keymapStore.endCapture();
				cardRef.current?.focus();
			};
			if (!open) {
				if (palette.preview || !showReadyToast) return null;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: `${switcher_module_css_default.root} ${switcher_module_css_default.wrapper}`,
					"data-skin": skinName,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: switcher_module_css_default.toast,
						onClick: dismissToast,
						children: strings.toastReady
					})
				});
			}
			const hasArchived = archivedIds.length > 0;
			const renaming = renameId !== null;
			const onKeyDown = (e) => {
				if (e.nativeEvent.isComposing || e.keyCode === 229) return;
				if (captureAction !== null) {
					if (e.key === "Escape") {
						e.preventDefault();
						cancelCapture();
					} else if (!isModifierKey(e.key)) {
						e.preventDefault();
						keymapStore.set(captureAction, bindingFromEvent(e));
						setCaptureAction(null);
					}
					return;
				}
				if (configuring) {
					if (e.key === "Escape") {
						e.preventDefault();
						closeSettings();
					}
					return;
				}
				if (renaming) {
					if (e.key === "Enter") {
						e.preventDefault();
						saveRename();
					} else if (e.key === "Escape") {
						e.preventDefault();
						cancelRename();
					}
					return;
				}
				if (e.key === "ArrowDown") {
					e.preventDefault();
					setIndex((i) => Math.min(i + 1, rowPositions.length - 1));
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					setIndex((i) => Math.max(i - 1, 0));
				} else if (e.key === "Enter") {
					e.preventDefault();
					if (selected !== null) openSession(selected.session.id);
				} else if (!searching && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && eventKey(e) === " ") {
					e.preventDefault();
					startPreview();
				} else if (e.key === "Escape") {
					e.preventDefault();
					if (searching) {
						if (query !== "") setQuery("");
						else exitSearch();
					} else if (showArchived) setShowArchived(false);
					else openStore.close();
				} else if (matchesBinding(keymap.bindings.toggle, e)) {
					e.preventDefault();
					openStore.close();
				} else if (searching) {
					if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && eventKey(e) === "n") {
						e.preventDefault();
						newConversation();
					} else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && eventKey(e) === "r" || e.key === "F2") {
						e.preventDefault();
						if (selected !== null) startRename(selected.session.id);
					} else if (e.altKey && !e.ctrlKey && !e.metaKey && eventKey(e) === "a") {
						e.preventDefault();
						if (selected !== null) archiveSession(selected.session.id);
					} else if (e.altKey && !e.ctrlKey && !e.metaKey && eventKey(e) === "h") {
						e.preventDefault();
						toggleHideOldSessions();
					} else if (e.altKey && !e.ctrlKey && !e.metaKey && eventKey(e) === "p") {
						e.preventDefault();
						jumpToPinnedRow();
					}
				} else if (!searching && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
					const k = eventKey(e);
					if (k === "s") {
						e.preventDefault();
						enterSearch();
					} else if (k === "n") {
						e.preventDefault();
						newConversation();
					} else if (k === "p") {
						e.preventDefault();
						jumpToPinnedRow();
					} else if (k === "a" && !showArchived) {
						e.preventDefault();
						if (selected !== null) archiveSession(selected.session.id);
					} else if (k === "u" && showArchived) {
						e.preventDefault();
						if (selected !== null) unarchiveSession(selected.session.id);
					} else if (k === "t" && (hasArchived || showArchived)) {
						e.preventDefault();
						setShowArchived((v) => !v);
					} else if (k === "r") {
						e.preventDefault();
						if (selected !== null) startRename(selected.session.id);
					} else if (k === "h") {
						e.preventDefault();
						toggleHideOldSessions();
					} else if (k === "k") {
						e.preventDefault();
						openSettings();
					}
				}
			};
			const renderRow = (row, rowIndex) => {
				const session = row.session;
				const wsId = row.workspace?.workspaceId;
				const hue = getWorkspaceHue(wsId, workspaceColorMap);
				const isColored = hue !== null;
				const wsStyle = isColored ? { "--ws-h": hue } : void 0;
				const wsClass = isColored ? `${switcher_module_css_default.wsTag} ${switcher_module_css_default.wsTagColored}` : `${switcher_module_css_default.wsTag} ${switcher_module_css_default.wsTagUngrouped}`;
				const wsLabel = row.workspace === void 0 ? strings.ungrouped : row.workspace.title;
				const turns = turnCountOf(session);
				const timeLevel = timeRecencyLevel(session.updatedAt);
				const timeClassKey = `timeL${timeLevel}`;
				const timeString = relTime(session.updatedAt);
				const isCurrent = session.id === currentId;
				const archived = archivedSet.has(session.id);
				const isPinned = pinnedSet.has(session.id);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					"data-row-index": rowIndex,
					className: rowIndex === index ? `${switcher_module_css_default.row} ${switcher_module_css_default.rowSelected}` : switcher_module_css_default.row,
					onMouseEnter: () => setIndex(rowIndex),
					onClick: () => openSession(session.id),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: session.running ? switcher_module_css_default.dot : `${switcher_module_css_default.dot} ${switcher_module_css_default.dotIdle}` }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: switcher_module_css_default.main,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: switcher_module_css_default.rowTitle,
								children: titleOf(session)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: switcher_module_css_default.rowMeta,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: wsClass,
										style: wsStyle,
										children: wsLabel
									}),
									turns !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: switcher_module_css_default.metaDivider,
										children: "·"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: switcher_module_css_default.metaItem,
										children: strings.turns(turns)
									})] }),
									timeString !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: switcher_module_css_default.metaDivider,
										children: "·"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: `${switcher_module_css_default.timeBadge} ${switcher_module_css_default[timeClassKey]}`,
										children: [timeLevel <= 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: switcher_module_css_default.liveDot }), timeString]
									})] })
								]
							})]
						}),
						isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: `${switcher_module_css_default.tag} ${switcher_module_css_default.tagCurrent}`,
							children: strings.current
						}),
						isPinned && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: `${switcher_module_css_default.tag} ${switcher_module_css_default.tagPinned}`,
							children: strings.pinned
						}),
						archived && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: switcher_module_css_default.tag,
							children: strings.archived
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: switcher_module_css_default.rowAction,
							onClick: (e) => {
								e.stopPropagation();
								startRename(session.id);
							},
							title: strings.renameTitle,
							children: strings.rowRename
						}),
						archived ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: switcher_module_css_default.rowAction,
							onClick: (e) => {
								e.stopPropagation();
								unarchiveSession(session.id);
							},
							children: strings.rowUnarchive
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${switcher_module_css_default.rowAction} ${switcher_module_css_default.rowActionDanger}`,
							onClick: (e) => {
								e.stopPropagation();
								archiveSession(session.id);
							},
							children: strings.rowArchive
						})
					]
				}, session.id);
			};
			let body;
			if (configuring) body = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: switcher_module_css_default.settings,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: switcher_module_css_default.officialShortcutsBar,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: switcher_module_css_default.officialShortcutsBtn,
							onClick: () => {
								openStore.close();
								ctx.openOfficialShortcuts?.();
							},
							children: strings.officialShortcutsBtn
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: switcher_module_css_default.settingsHint,
						children: strings.settingsHint
					}),
					ACTIONS.map((action) => {
						const binding = keymap.bindings[action];
						const active = captureAction === action;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: switcher_module_css_default.settingsRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: switcher_module_css_default.settingsLabel,
								children: strings.actionLabels[action]
							}), active ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: switcher_module_css_default.captureHint,
								children: strings.captureHint
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("kbd", {
								className: switcher_module_css_default.kbd,
								children: formatBinding(binding)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: switcher_module_css_default.rowAction,
								onClick: () => startCapture(action),
								children: strings.changeKey
							})] })]
						}, action);
					})
				]
			});
			else if (workspacesSnap.phase !== "ready" || sessionsSnap.phase !== "ready") body = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: switcher_module_css_default.empty,
				children: strings.loading
			});
			else if (rowPositions.length === 0) body = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: switcher_module_css_default.empty,
				children: searching ? strings.noMatches : showArchived ? strings.noArchived : workspaceItems.length === 0 ? strings.noWorkspaces : strings.noConversations
			});
			else {
				let rowCursor = 0;
				body = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: switcher_module_css_default.list,
					ref: listRef,
					children: items.map((item) => {
						if (item.kind === "header") {
							const hue = getWorkspaceHue(item.key === "__ungrouped__" ? void 0 : item.key, workspaceColorMap);
							const isColored = hue !== null;
							const wsStyle = isColored ? { "--ws-h": hue } : void 0;
							const wsClass = isColored ? `${switcher_module_css_default.wsTag} ${switcher_module_css_default.wsTagColored}` : `${switcher_module_css_default.wsTag} ${switcher_module_css_default.wsTagUngrouped}`;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: switcher_module_css_default.groupHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: wsClass,
									style: wsStyle,
									children: item.label
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.groupCount,
									children: item.count
								})]
							}, item.key);
						}
						if (item.kind === "folded") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: switcher_module_css_default.foldedRow,
							onClick: () => toggleGroupExpand(item.groupKey),
							title: item.expanded ? strings.collapseOlderTitle : strings.expandOlderTitle,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: switcher_module_css_default.foldedIcon,
								children: item.expanded ? "▼" : "▶"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: switcher_module_css_default.foldedLabel,
								children: item.label
							})]
						}, item.key);
						const rowIndex = rowCursor;
						rowCursor += 1;
						return renderRow(item, rowIndex);
					})
				});
			}
			const toggleLabel = formatBinding(keymap.bindings.toggle);
			const hasPinned = pinnedIds.length > 0;
			const hint = configuring ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: switcher_module_css_default.footer,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: switcher_module_css_default.footerAction,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Esc" }), strings.close]
				})
			}) : searching ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: switcher_module_css_default.footer,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "↑↓" }),
							strings.select,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Enter" }),
							strings.open
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Ctrl+N" }), strings.newShort]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Ctrl+R" }), strings.renameShort]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Alt+A" }), strings.archiveShort]
					}),
					hasPinned && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Alt+P" }), strings.pinnedShort]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Alt+H" }), hideOldSessions ? strings.showAll : strings.recentOnly]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Esc" }), query ? strings.clear : strings.manageMode]
					})
				]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: switcher_module_css_default.footer,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "↑↓" }),
							strings.select,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Enter" }),
							strings.open
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: strings.space }), strings.preview]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "S" }), strings.search]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "N" }), strings.newShort]
					}),
					hasPinned && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "P" }), strings.pinnedShort]
					}),
					showArchived ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "U" }), strings.rowUnarchive]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "T" }), strings.backToList]
					})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "A" }), strings.archiveShort]
					}), hasArchived && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "T" }), strings.archivedView]
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "R" }), strings.renameShort]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "H" }), hideOldSessions ? strings.showAll : strings.recentOnly]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "K" }), strings.shortcuts]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: switcher_module_css_default.footerAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: "Esc" }), showArchived ? strings.backToList : strings.close]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: `${switcher_module_css_default.footerAction} ${switcher_module_css_default.footerPush}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Kbd, { children: toggleLabel }), strings.toggle]
					})
				]
			});
			const strip = configuring ? null : renaming ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: switcher_module_css_default.renameBar,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: renameRef,
						className: switcher_module_css_default.renameInput,
						value: renameDraft,
						placeholder: strings.renamePlaceholder,
						onChange: (e) => setRenameDraft(e.target.value)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: switcher_module_css_default.rowAction,
						onClick: () => void saveRename(),
						children: strings.save
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: switcher_module_css_default.rowAction,
						onClick: cancelRename,
						children: strings.cancel
					})
				]
			}) : searching ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				ref: inputRef,
				className: switcher_module_css_default.input,
				placeholder: strings.searchPlaceholder,
				value: query,
				onChange: (e) => setQuery(e.target.value)
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: switcher_module_css_default.searchStrip,
				onClick: enterSearch,
				children: strings.searchStrip
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `${switcher_module_css_default.root} ${switcher_module_css_default.overlay}`,
				"data-skin": skinName,
				onMouseDown: (e) => {
					if (e.target === e.currentTarget) openStore.close();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: cardRef,
					tabIndex: -1,
					className: switcher_module_css_default.card,
					onKeyDown,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: switcher_module_css_default.header,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.title,
									children: strings.title
								}),
								showArchived && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.modeTag,
									children: strings.modeArchived
								}),
								searching && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.modeTag,
									children: strings.search
								}),
								renaming && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.modeTag,
									children: strings.modeRename
								}),
								configuring && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: switcher_module_css_default.modeTag,
									children: strings.modeShortcuts
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: `${switcher_module_css_default.skinButton} ${hideOldSessions ? switcher_module_css_default.activeButton : ""}`,
									onClick: toggleHideOldSessions,
									title: hideOldSessions ? strings.hideOldTitleRecent : strings.hideOldTitleAll,
									children: hideOldSessions ? strings.hideOldRecent : strings.hideOldAll
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: switcher_module_css_default.skinButton,
									onClick: configuring ? closeSettings : openSettings,
									title: strings.settingsTitle,
									children: "⚙"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: switcher_module_css_default.skinButton,
									onClick: cycleSkin,
									title: strings.skinTitle,
									children: strings.skinLabels[skinName]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: switcher_module_css_default.newButton,
									onClick: newConversation,
									children: strings.newConversation
								})
							]
						}),
						strip,
						body,
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: switcher_module_css_default.errorLine,
							children: error
						}),
						hint
					]
				})
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Services the switcher reads from the context (service names, not modules).
		*  `layout` / `sidebarRight` are intentionally NOT injected: the layout
		*  chords must degrade gracefully (log + no-op) when either service is absent
		*  (non-web profiles), so they resolve lazily behind a guard instead. */
		const inject = [
			"sessions",
			"workspaces",
			"uiWorkspace"
		];
		/** IME-composition guard: while a CJK
		*  input method owns the key, chords must not fire — modifiers like Ctrl+B
		*  would otherwise break candidate selection mid-composition. This handler
		*  runs on window capture, ahead of any document-level guard, so
		*  the check is this plugin's own responsibility. */
		function isImeComposition(event) {
			return event.isComposing || event.keyCode === 229;
		}
		/** Whether the key event's target is an editable field (input / textarea /
		*  contentEditable). The Ctrl+X prefix sequence is disabled there so a real
		*  cut gesture is never hijacked. */
		function isEditableTarget(target) {
			if (!(target instanceof HTMLElement)) return false;
			const el = target;
			return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable === true;
		}
		/** Whether an editable target has a non-empty text selection (a real cut /
		*  copy selection). Outside editable fields there is never a cut selection. */
		function hasSelection(target) {
			if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
				if (target instanceof HTMLElement && target.isContentEditable) {
					const sel = window.getSelection();
					return sel !== null && !sel.isCollapsed;
				}
				return false;
			}
			return target.selectionStart !== null && target.selectionEnd !== null && target.selectionStart !== target.selectionEnd;
		}
		/** Write a new value into a controlled input/textarea and notify React. */
		function setNativeValue(el, value) {
			(Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set ?? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set)?.call(el, value);
			el.dispatchEvent(new Event("input", { bubbles: true }));
		}
		/** Clear the whole draft of an editable (input/textarea). */
		function clearEditable(target) {
			if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
			setNativeValue(target, "");
			target.setSelectionRange(0, 0);
		}
		/**
		* Claude-Code-CLI-style line deletion: remove the text before the caret on
		* the current line (or the whole previous line when the caret already sits
		* at a line start). Holding the key (auto-repeat) deletes repeatedly.
		* Selection takes priority — a non-empty selection is deleted first, which
		* is the standard editable behavior.
		*/
		function deleteLineBeforeCaret(target) {
			if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
			const el = target;
			const value = el.value;
			const start = el.selectionStart ?? value.length;
			const end = el.selectionEnd ?? start;
			if (start === 0 && end === 0) return;
			if (end > start) {
				setNativeValue(el, value.slice(0, start) + value.slice(end));
				el.setSelectionRange(start, start);
				return;
			}
			const lineStart = value.lastIndexOf("\n", start - 1) + 1;
			if (lineStart < start) {
				setNativeValue(el, value.slice(0, lineStart) + value.slice(start));
				el.setSelectionRange(lineStart, lineStart);
				return;
			}
			if (start === 0) return;
			const prevLineStart = value.lastIndexOf("\n", start - 2) + 1;
			setNativeValue(el, value.slice(0, prevLineStart) + value.slice(start));
			el.setSelectionRange(prevLineStart, prevLineStart);
		}
		/** Toggle dsh-synapse's conversation-map view: click the opposite view
		*  switch button (`data-view="map"` ⇄ `data-view="dialog"`). No-op when the
		*  synapse view switcher is absent. */
		function toggleSessionMapView() {
			const buttons = Array.from(document.querySelectorAll("button[data-view]"));
			if (buttons.length === 0) return;
			const map = buttons.find((button) => button.dataset.view === "map");
			const dialog = buttons.find((button) => button.dataset.view === "dialog");
			if (map === void 0 || dialog === void 0) return;
			(map.getAttribute("aria-pressed") === "true" || map.classList.contains("active") ? dialog : map).click();
		}
		/** Find the session composer textarea (the only main input box). */
		function findComposerTextarea() {
			const candidates = Array.from(document.querySelectorAll("textarea")).filter((ta) => ta.offsetParent !== null);
			return candidates.find((ta) => ta.placeholder.includes("发消息")) ?? candidates.find((ta) => ta.placeholder.includes("message")) ?? candidates[0] ?? null;
		}
		/**
		* "Pull up /model": insert the `/model` command token into the composer and
		* let DSH's slash trigger open the model popupSelect. Uses the native value
		* setter so React's controlled textarea observes the change, preserving any
		* existing draft by appending the token.
		*/
		function insertModelCommand() {
			const ta = findComposerTextarea();
			if (ta === null) return;
			const current = ta.value;
			const token = current.trim() === "" ? "/model" : `${current.replace(/\s+$/, "")} /model`;
			(Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set)?.call(ta, token);
			ta.dispatchEvent(new Event("input", { bubbles: true }));
			ta.focus();
			ta.setSelectionRange(token.length, token.length);
		}
		/**
		* Mount the switcher: one React root hosting the palette, plus the global
		* keydown handler (driven by the customizable keymap). Torn down on dispose.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const sessions = ctx.sessions;
			const workspaces = ctx.workspaces;
			const uiWorkspace = ctx.get("uiWorkspace") ?? ctx.uiWorkspace;
			const openOfficialShortcuts = () => {
				window.dispatchEvent(new KeyboardEvent("keydown", {
					key: "/",
					code: "Slash",
					ctrlKey: true,
					bubbles: true,
					cancelable: true
				}));
			};
			const switcherCtx = {
				sessions,
				workspaces,
				uiWorkspace,
				openOfficialShortcuts
			};
			const openStore = createOpenStore();
			const keymapStore = createKeymapStore();
			ctx.effect(() => installSwitcherLocale(ctx.get("locale")), "session-switcher: locale");
			let container = null;
			let root = null;
			let xPrefixArmed = false;
			let xPrefixTimer;
			let lastToggleTime = 0;
			const guardedToggle = () => {
				const now = Date.now();
				if (now - lastToggleTime < 180) return;
				lastToggleTime = now;
				openStore.toggle();
			};
			const disarmXPefix = () => {
				xPrefixArmed = false;
				if (xPrefixTimer !== void 0) {
					window.clearTimeout(xPrefixTimer);
					xPrefixTimer = void 0;
				}
			};
			let lastNavigatedSessionId;
			const navigateToSession = (sessionId) => {
				lastNavigatedSessionId = sessionId;
				const ui = ctx.get("uiWorkspace") ?? ctx.uiWorkspace;
				if (ui?.openSession) ui.openSession(sessionId);
				else if (sessions.open) sessions.open(sessionId);
			};
			/**
			* Open the conversation `offset` positions away (wraps around), moving
			* through the exact visual order the left sidebar shows. The anchor is the
			* current session itself when it is a list row (forked branches included);
			* a subagent child anchors on its nearest listed ancestor.
			*/
			const switchByOffset = (offset) => {
				const sessionsSnap = sessions.list.getSnapshot();
				const workspacesSnap = workspaces.list.getSnapshot();
				const curId = currentSessionId(sessionsSnap, lastNavigatedSessionId);
				const entries = sidebarOrder(sessionsSnap, workspacesSnap, { currentId: curId });
				const target = offsetTarget(entries, cycleAnchor(entries, curId, sessionsSnap.byId), offset);
				if (target !== void 0) navigateToSession(target.session.id);
			};
			/**
			* Jump directly to the pinned session, or cycle through pinned sessions
			* if multiple are pinned and one is already active.
			*/
			const jumpToPinned = () => {
				const sessionsSnap = sessions.list.getSnapshot();
				const workspacesSnap = workspaces.list.getSnapshot();
				const curId = currentSessionId(sessionsSnap, lastNavigatedSessionId);
				const pinnedList = pinnedSessions(sessionsSnap, workspacesSnap, { currentId: curId });
				if (pinnedList.length === 0) return;
				const currentIndex = pinnedList.findIndex((item) => item.session.id === curId);
				if (currentIndex !== -1) {
					const nextIndex = (currentIndex + 1) % pinnedList.length;
					navigateToSession(pinnedList[nextIndex].session.id);
				} else navigateToSession(pinnedList[0].session.id);
			};
			const officialShortcuts = ctx.get("shortcuts");
			if (officialShortcuts !== void 0 && typeof officialShortcuts.register === "function") ctx.effect(() => {
				try {
					const offToggle = officialShortcuts.register({
						id: "sessionSwitcher.toggle",
						label: () => switcherStrings().officialToggleLabel,
						aliases: [...switcherStrings().aliasesToggle],
						defaults: {
							"web:linux": {
								code: "KeyK",
								modifiers: ["primary"]
							},
							"web:windows": {
								code: "KeyK",
								modifiers: ["primary"]
							},
							"web:macos": {
								code: "KeyK",
								modifiers: ["primary"]
							},
							"desktop:linux": {
								code: "KeyK",
								modifiers: ["primary"]
							},
							"desktop:windows": {
								code: "KeyK",
								modifiers: ["primary"]
							},
							"desktop:macos": {
								code: "KeyK",
								modifiers: ["primary"]
							}
						},
						regions: [
							"page",
							"editable",
							"terminal"
						],
						modals: [],
						resolve: () => ({
							status: "handled",
							run: guardedToggle
						})
					});
					const offNext = officialShortcuts.register({
						id: "sessionSwitcher.next",
						label: () => switcherStrings().officialNextLabel,
						aliases: [...switcherStrings().aliasesNext],
						defaults: {
							"web:linux": {
								code: "BracketRight",
								modifiers: ["primary"]
							},
							"web:windows": {
								code: "BracketRight",
								modifiers: ["primary"]
							},
							"web:macos": {
								code: "BracketRight",
								modifiers: ["primary"]
							},
							"desktop:linux": {
								code: "BracketRight",
								modifiers: ["primary"]
							},
							"desktop:windows": {
								code: "BracketRight",
								modifiers: ["primary"]
							},
							"desktop:macos": {
								code: "BracketRight",
								modifiers: ["primary"]
							}
						},
						regions: ["page", "editable"],
						modals: [],
						resolve: () => ({
							status: "handled",
							run: () => {
								switchByOffset(1);
							}
						})
					});
					const offPrev = officialShortcuts.register({
						id: "sessionSwitcher.prev",
						label: () => switcherStrings().officialPrevLabel,
						aliases: [...switcherStrings().aliasesPrev],
						defaults: {
							"web:linux": {
								code: "BracketLeft",
								modifiers: ["primary"]
							},
							"web:windows": {
								code: "BracketLeft",
								modifiers: ["primary"]
							},
							"web:macos": {
								code: "BracketLeft",
								modifiers: ["primary"]
							},
							"desktop:linux": {
								code: "BracketLeft",
								modifiers: ["primary"]
							},
							"desktop:windows": {
								code: "BracketLeft",
								modifiers: ["primary"]
							},
							"desktop:macos": {
								code: "BracketLeft",
								modifiers: ["primary"]
							}
						},
						regions: ["page", "editable"],
						modals: [],
						resolve: () => ({
							status: "handled",
							run: () => {
								switchByOffset(-1);
							}
						})
					});
					const offPinned = officialShortcuts.register({
						id: "sessionSwitcher.jumpToPinned",
						label: () => switcherStrings().officialPinnedLabel,
						aliases: [...switcherStrings().aliasesPinned],
						defaults: {
							"web:linux": {
								code: "KeyP",
								modifiers: ["alt"]
							},
							"web:windows": {
								code: "KeyP",
								modifiers: ["alt"]
							},
							"web:macos": {
								code: "KeyP",
								modifiers: ["alt"]
							},
							"desktop:linux": {
								code: "KeyP",
								modifiers: ["alt"]
							},
							"desktop:windows": {
								code: "KeyP",
								modifiers: ["alt"]
							},
							"desktop:macos": {
								code: "KeyP",
								modifiers: ["alt"]
							}
						},
						regions: ["page", "editable"],
						modals: [],
						resolve: () => ({
							status: "handled",
							run: jumpToPinned
						})
					});
					return () => {
						offToggle();
						offNext();
						offPrev();
						offPinned();
					};
				} catch (err) {
					console.warn("[session-switcher] official shortcuts registration skipped:", err);
					return () => {};
				}
			}, "session-switcher: official shortcuts");
			const onWindowKeyDown = (e) => {
				const { bindings, capturing } = keymapStore.getSnapshot();
				if (capturing) return;
				if (isImeComposition(e)) return;
				const layout = ctx.get("layout");
				const sidebarRight = ctx.get("sidebarRight");
				const paletteState = openStore.getSnapshot();
				const open = paletteState.open;
				if (paletteState.preview) {
					const cancelPreview = () => {
						const from = openStore.getSnapshot().previewFromId;
						if (from !== void 0) navigateToSession(from);
					};
					if (e.key === "Escape") {
						e.preventDefault();
						cancelPreview();
						openStore.exitPreview();
					} else if (e.key === "Enter") {
						e.preventDefault();
						openStore.confirmPreview();
					} else if (matchesBinding(bindings.toggle, e)) {
						e.preventDefault();
						cancelPreview();
						openStore.close();
					} else if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && eventKey(e) === "k") {
						e.preventDefault();
						cancelPreview();
						openStore.close();
					}
					return;
				}
				if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && eventKey(e) === "u") {
					e.preventDefault();
					if (isEditableTarget(e.target)) deleteLineBeforeCaret(e.target);
					return;
				}
				if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && eventKey(e) === "c") {
					if (isEditableTarget(e.target) && !hasSelection(e.target)) {
						e.preventDefault();
						clearEditable(e.target);
					}
					return;
				}
				if (isEditableTarget(e.target) && hasSelection(e.target)) {
					if (xPrefixArmed) disarmXPefix();
				} else {
					if (xPrefixArmed && !e.ctrlKey && !e.metaKey && !e.altKey && eventKey(e) === "m") {
						e.preventDefault();
						disarmXPefix();
						insertModelCommand();
						return;
					}
					if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && eventKey(e) === "x") {
						xPrefixArmed = true;
						if (xPrefixTimer !== void 0) window.clearTimeout(xPrefixTimer);
						xPrefixTimer = window.setTimeout(disarmXPefix, 1500);
						return;
					}
					if (xPrefixArmed) disarmXPefix();
				}
				if (matchesBinding(bindings.toggle, e)) {
					e.preventDefault();
					guardedToggle();
					return;
				}
				if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && eventKey(e) === "k") {
					e.preventDefault();
					guardedToggle();
					return;
				}
				if (!open && matchesBinding(bindings.next, e)) {
					e.preventDefault();
					switchByOffset(1);
					return;
				}
				if (!open && matchesBinding(bindings.prev, e)) {
					e.preventDefault();
					switchByOffset(-1);
					return;
				}
				if (!open && matchesBinding(bindings.jumpToPinned, e)) {
					e.preventDefault();
					jumpToPinned();
					return;
				}
				if (!open) {
					if (matchesBinding(bindings.toggleLeftSidebar, e)) {
						e.preventDefault();
						if (layout !== void 0) layout.toggleSidebar();
						else console.warn("[session-switcher] layout chord: ui-layout service missing");
						return;
					}
					if (matchesBinding(bindings.toggleRightSidebar, e)) {
						e.preventDefault();
						if (sidebarRight === void 0) console.warn("[session-switcher] layout chord: ui-sidebar-right service missing");
						else try {
							sidebarRight.toggleExpanded();
						} catch {
							console.warn("[session-switcher] layout chord: no session mounted for the right column");
						}
						return;
					}
					if (matchesBinding(bindings.toggleSessionMap, e)) {
						e.preventDefault();
						toggleSessionMapView();
						return;
					}
				}
				if (e.key === "Escape") {
					if (open) {
						if (container === null || !container.contains(e.target)) {
							e.preventDefault();
							openStore.close();
						}
						return;
					}
					if (sidebarRight?.isExpanded() === true) {
						e.preventDefault();
						sidebarRight.toggleExpanded();
					}
				}
			};
			window.addEventListener("keydown", onWindowKeyDown, true);
			container = document.createElement("div");
			document.body.appendChild(container);
			root = (0, react_dom_client.createRoot)(container);
			root.render((0, react.createElement)(Switcher, {
				ctx: switcherCtx,
				openStore,
				keymapStore
			}));
			console.log(switcherStrings().readyMessage);
			ctx.effect(() => () => {
				disarmXPefix();
				window.removeEventListener("keydown", onWindowKeyDown, true);
				if (root !== null) {
					root.unmount();
					root = null;
				}
				if (container !== null) {
					container.remove();
					container = null;
				}
			}, "ui-session-switcher: lifecycle");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map