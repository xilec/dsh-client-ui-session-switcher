/**
 * Local structural ports for the two injected services (inject = sessions,
 * workspaces). The switcher reads the snapshot stores plus the small write
 * surface it calls — deliberately narrower than the upstream contracts: the
 * published 0.1.0-rc.6 typings predate `workspace.unarchiveSession` (added in
 * the harness repo, see PLUGIN-HANDOFF §2.2), so the ports document exactly
 * what this plugin may touch. The runtime instances satisfy these faces; the
 * boundary cast lives in src/client/index.ts.
 * @module @suxeca/dsh-client-ui-session-switcher/client/port
 */
export {};
