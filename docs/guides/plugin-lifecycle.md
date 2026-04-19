---
title: "Plugin Lifecycle"
sidebar_label: "Plugin Lifecycle"
---

# Plugin Lifecycle

This guide explains the complete lifecycle of a Deadworks plugin, from loading to unloading.

## Lifecycle Flow

```
Server Start
    │
    ├── OnPrecacheResources()     ← Precache particles, models, heroes
    │
    ├── OnLoad(isReload: false)   ← Plugin first loaded
    │
    ├── OnStartupServer()         ← Server map loaded, set convars here
    │
    │   ┌─────────────────────────────┐
    │   │        SERVER RUNNING       │
    │   │                             │
    │   │  OnClientConnect()          │
    │   │  OnClientPutInServer()      │
    |   |  ... other hooks ...        |
    │   └─────────────────────────────┘
    │
    ├── OnUnload()                ← Plugin unloaded
    │
    └── (Hot-reload) → OnLoad(isReload: true)
```

## Startup Phase

### OnPrecacheResources

Called during map load. **Must** precache all resources (particles, models, etc.) here.

```csharp
public override void OnPrecacheResources()
{
    Precache.AddResource("particles/upgrades/mystical_piano_hit.vpcf");
}
```

See [Precaching](../api-reference/precaching.md).

### OnLoad

Called when the plugin is loaded. The `isReload` parameter is `true` during hot-reload.

```csharp
public override void OnLoad(bool isReload)
{
    Console.WriteLine($"[{Name}] Loaded! (reload={isReload})");

    if (!isReload)
    {
        // First-time initialization only
    }
}
```

### OnStartupServer

Called when the server starts a new map. Ideal for setting game convars:

```csharp
public override void OnStartupServer()
{
    ConVar.Find("citadel_trooper_spawn_enabled")?.SetInt(0);
    ConVar.Find("citadel_allow_duplicate_heroes")?.SetInt(1);
}
```

## Runtime Phase

During runtime, your plugin responds to events through hooks and registered commands.

### Event Processing Order

1. **Entity events** — creation, spawn, deletion, touch
2. **Player events** — connect, disconnect, commands
3. **Gameplay events** — damage, currency, chat
4. **Frame events** — `OnGameFrame` every tick

### Hot-Reloading

When a plugin is hot-reloaded:

1. `OnUnload()` is called on the old instance
2. `OnLoad(isReload: true)` is called on the new instance
3. All registered commands and hooks are re-registered

**Important:** Clean up timers and hooks in `OnUnload()` to avoid duplicates after reload.

## Shutdown Phase

### OnUnload

Called when the plugin is unloaded (server shutdown, hot-reload, or manual unload).

```csharp
public override void OnUnload()
{
    Console.WriteLine($"[{Name}] Unloaded!");
    // Timers are automatically cleaned up per-plugin
    // EntityData stores are automatically cleaned up
}
```

**What's cleaned up automatically:**
- Per-plugin timers
- `EntityData<T>` entries (on entity deletion)

**What you should clean up manually:**
- Dynamic game event listeners (via `IHandle.Cancel()`)
- Any external resources or connections

## Client Lifecycle

```
Player connects
    │
    ├── OnClientPutInServer()   ← Initial connection
    │
    ├── OnClientFullConnect()   ← Fully in-game, can interact
    │
    │   (player is active in-game)
    │
    └── OnClientDisconnect()    ← Player leaves
```

### Example: Player Tracking

```csharp
private readonly HashSet<int> _activePlayers = new();

public override void OnClientFullConnect(ClientFullConnectEvent args)
{
    _activePlayers.Add(args.Slot);
    Console.WriteLine($"Player connected: slot {args.Slot}");
}

public override void OnClientDisconnect(ClientDisconnectedEvent args)
{
    _activePlayers.Remove(args.Slot);
    Console.WriteLine($"Player disconnected: slot {args.Slot}");
}
```

> You may use [`Players`](../api-reference/players.md) instead to access all players

## Async Work — Get Back On the Game Thread

After `await`, C# may resume on a thread-pool thread. Touching any game object off the main thread will corrupt memory or crash. **Always** wrap game-touching code in `Timer.NextTick(...)` after an `await`:

```csharp
public override void OnLoad(bool isReload)
{
    // OnLoad is not async — kick off the work and don't await
    _ = FetchAndAnnounceAsync();
}

private async Task FetchAndAnnounceAsync()
{
    using var client = new HttpClient();
    var response = await client.GetStringAsync("https://api.example.com/message");

    // At this point we may be on a non-game thread.
    Timer.NextTick(() =>
    {
        // Safe to interact with the game here.
    });
}
```

The same rule applies to `Task.Delay`, `Task.Run`, file I/O, anything that yields. If you're not sure whether the continuation is on the game thread, route it through `Timer.NextTick`.

## Hot-Reload Gotchas

Hot-reload replaces the plugin assembly while the server keeps running. This is very useful during development, but there are some pitfalls:

- **Cancel long-running work in `OnUnload`.** Per-plugin timers and `EntityData<T>` entries are cleaned up automatically. Anything else — `CancellationTokenSource`, `FileSystemWatcher`, sockets, `Timer.Sequence` handles you want to stop — has to be cancelled or disposed manually.
- **Static state persists.** Types in a new load context have fresh statics, but if you've cached anything in a host assembly (shared `DeadworksManaged.Api` types, for example), it will still be there after a reload. Use `isReload` to decide whether to re-initialize.
- **`Console.WriteLine` during `OnLoad` may vanish on first boot.** The console buffer can swallow the first batch of log lines before idling; a reload (hot-reload the plugin, or edit the DLL while the server runs) will make the logs appear. If you need reliable output from first boot, log through a file instead.

## Console Output on Windows

If you launch `deadworks.exe` from Windows Terminal or PowerShell and the console window keeps overwriting its own top line (showing only `N/31 on map dl_midtown` no matter how far up you scroll), that's a terminal compatibility issue with Deadlock's progress reporting. Launch from `cmd.exe` (the classic console host) instead and the problem goes away.

## See Also

- [Plugin Base](../api-reference/plugin-base.md) — All lifecycle hooks
- [Precaching](../api-reference/precaching.md) — Resource precaching
- [Console Commands](../api-reference/console-commands.md) — ConVar setup in OnStartupServer
- [Server Hosting](server-hosting.md) — Running a dedicated server
