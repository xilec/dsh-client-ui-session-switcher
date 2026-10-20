# @suxeca/dsh-client-ui-session-switcher (fork build)

```
⚠️ 本仓库是**自动生成的发布镜像**，每次发布都会整体覆盖 `main`。
**唯一事实来源 / single source of truth:** [https://github.com/xilec/dsh-plugin → packages/dsh-client-ui-session-switcher](https://github.com/xilec/dsh-plugin/tree/main/packages/dsh-client-ui-session-switcher)
```

**This is a FORK build.** It carries two fixes that are not yet in the upstream
release, so the plugin can be tested locally before the upstream pull requests
land:

- **Layout-independent chords** — the palette, the Ctrl+[ / ] cycle and the
  panel's letter shortcuts resolve from `event.code` (the physical key) instead
  of `event.key`, so Ctrl+K works on a Russian (or any non-Latin) layout.
- **zh/en localization** — the palette follows the DSH platform locale service
  instead of being hard-coded Chinese.

## 安装 / Install

```bash
dsh plugin add github:xilec/dsh-client-ui-session-switcher
```

无需构建：`lib/` 已预编译随仓库发布（prebuilt）。

## 许可 / License

MIT License — 见 [`LICENSE`](LICENSE)。
