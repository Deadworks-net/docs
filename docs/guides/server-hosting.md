---
title: "Server Hosting"
sidebar_label: "Server Hosting"
---

# Server Hosting

This guide covers running a Deadworks dedicated server — launch options, ports, firewalls, and the operational quirks that surface once real players try to connect.

## Launching the Server

`deadworks.exe` replaces `deadlock.exe` for launching. The same Source launch arguments work, so you can reuse any startup scripts you already have — just point them at `deadworks.exe`.

The default arguments Deadworks uses when started with no flags are:

```
-dedicated -console -dev -insecure -allow_no_lobby_connect
+tv_citadel_auto_record 0 +spec_replay_enable 0 +tv_enable 0
+citadel_upload_replay_enabled 0
+hostport 27015
+map dl_midtown
```

Override any of them on the command line. `+hostport` is the port the server listens on for game traffic (UDP).

## The Local-Development Port Conflict

When you run the game on the same machine as a Deadworks server, Deadlock's local hideout server and your dedicated server both try to bind `27015`. Symptoms include:

- Your main game auto-joins the dedicated server on launch and crashes
- Connecting in the other order erases your hideout pawn/HUD and then crashes
- `AccessViolationException` on the first connect

**Fix:** run your dev server on a different port and connect explicitly.

```
deadworks.exe +hostport 27016 +map dl_midtown
```

Then from Deadlock's console: `connect localhost:27016`.

Production servers should stay on `27015` so `connect mogdl.com` (no port) resolves correctly via A2S.

## Opening the Firewall (Windows / VPS)

On a fresh Windows VPS the port you configured is almost certainly blocked by the Windows Firewall, even if the VPS provider's network-level firewall is open. Run this in PowerShell (as Administrator) once:

```powershell
New-NetFirewallRule -DisplayName "Deadworks TCP 27015" `
  -Direction Inbound -LocalPort 27015 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "Deadworks UDP 27015" `
  -Direction Inbound -LocalPort 27015 -Protocol UDP -Action Allow
```

Both protocols matter — Source uses UDP for gameplay and TCP for some queries.

## Port Forwarding vs SDR

You have two options for letting players outside your LAN connect:

### Port Forwarding (recommended for public servers)

Forward UDP/TCP `27015` (or your chosen port) on your router or VPS firewall. Players then connect with:

```
connect your.public.ip:27015
```

This is also what makes `steam://connect/<ip>:<port>` deep links work — Steam issues an A2S query against the IP, and Deadworks' A2S patch responds so the connect button actually joins.

If you're behind CGNAT and can't port-forward, SDR is your only option.

### Steam Datagram Relay (SDR)

SDR gives you an IP that's hosted on Valve's relay network — no ports exposed on your side. Follow the Deadlock modding community's guide to enable it: [deadlockmodding.pages.dev/dedicated-server-hosting#setting-up-for-hosting](https://deadlockmodding.pages.dev/dedicated-server-hosting#setting-up-for-hosting).

**SDR caveats:**

- `steam://connect/` deep links do **not** work with SDR relay addresses, only with regular `ip:port`. If you want a one-click join button, you need port forwarding.
- Some users report that a subset of their friends can't connect via IP even with SDR enabled. If that happens, collect ping/traceroute data from the affected users — there's no known deterministic fix.

## Controlling the Match

### Pausing

Deadlock has two pause commands. On a **dedicated server**, use the citadel-specific one:

```csharp
Server.ExecuteCommand("citadel_toggle_server_pause");
```

The plain `pause` command only works on listen (in-game hosted) servers. While the server is paused, clients who join see the "Joining as &lt;hero&gt;" screen until the server resumes.

### Changing Map Without Disconnecting Everyone

```csharp
Server.ExecuteCommand("changelevel dl_some_map");
```

Unlike a fresh server restart, `changelevel` keeps connected controllers around — players don't have to reconnect.

### Disabling Troopers / NPCs

Useful for non-MOBA game modes:

```csharp
public override void OnStartupServer() {
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_npc_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_start_players_on_zipline")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
}
```

**Do not** set `citadel_trooper_squad_size` to `0` — the server crashes with a divide-by-zero.

## Cleaning Up Disconnected Players

By default a disconnected player's controller lingers. If your plugin tracks players, remove them on disconnect:

```csharp
public override void OnClientDisconnect(ClientDisconnectedEvent args) {
    _playerState.Remove(args.Slot);
    args.Controller?.Remove();
}
```

For map changes, prefer `changelevel` over a restart — connected controllers are preserved, so you don't need to handle a mass re-join.

## Server Poisoning — Local Dev Hazard

Running a dedicated server from the same install directory as your main game can sometimes rewrite your personal config files or leave artifacts that break the game. Symptoms include:

- Chat wheel binds reset on next launch
- Movement or HUD breaking in the main game even with no mods loaded

Workarounds:

- Keep dedicated-server and play installs in separate directories (two Steam library folders, or one install copied to a separate path)
- If something gets wedged, copying the Deadlock folder elsewhere (e.g. to a different drive) and running from there has resolved it for multiple users

## Linux / Docker

Valve has not published a native Linux dedicated-server binary for Deadlock. You can still run Deadworks on Linux through Proton in a Docker container; [raimannma/deadworks](https://github.com/raimannma/deadworks) maintains a working image. This isn't part of the upstream repo yet but has been submitted as PRs.

## steam:// Connect Links

| Link form | Works? | Notes |
|---|---|---|
| `steam://connect/1.2.3.4:27015` | ✓ | Works at game startup and once Deadlock is already running (via the A2S patch) |
| `steam://connect/yourdomain.com:27015` | ✗ from browser | Steam's deep-link handler doesn't resolve DNS — use the public IP |
| `steam://connect/<SDR-id>` | ✗ | Steam ignores SDR IDs in connect links |

If you need a web button, resolve the DNS server-side and emit the raw IP:port into the `href`.

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Only the host can join via IP; others can't even with firewall open | Known issue, no deterministic fix. Try SDR as a fallback. |
| "appID is invalid" dialog on `steam://connect/` | Happens when Deadlock is already running. Close the game first, or use the in-game console `connect <ip>:<port>`. |
| Game auto-joins server on launch and crashes | Port conflict with the local hideout server. See [The Local-Development Port Conflict](#the-local-development-port-conflict). |
| Plugin folder silently ignored on VPS | Wrong .NET SDK version. Pipe console output to a file and search for `[ERR] Failed to initialize .NET runtime`. Install .NET 10 SDK on the VPS. |
| Can't redirect players to another server | Not supported — Deadlock's client doesn't honor server-issued redirects, so "hub-to-minigame" handoffs aren't possible today. |
